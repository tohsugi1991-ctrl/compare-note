import { beforeEach, describe, expect, it } from 'vitest';
import {
  addCandidate,
  clearAllData,
  createDecision,
  createProject,
  deleteCandidate,
  deleteDecision,
  deleteProject,
  exportData,
  getDecision,
  getProject,
  importData,
  listCandidates,
  listProjects,
  listProjectsWithSummary,
  loadData,
  saveData,
  saveDecision,
  updateCandidate,
  updateDecision,
  updateProject,
} from './storage';

const STORAGE_KEY = 'compare-note:v1';

beforeEach(() => {
  localStorage.clear();
});

describe('loadData', () => {
  it('初期データを読み込める', () => {
    const data = loadData();
    expect(data).toEqual({ projects: [], candidates: [], decisions: [] });
  });

  it('不正JSON時に初期状態へフォールバックする', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadData()).toEqual({ projects: [], candidates: [], decisions: [] });
  });

  it('形は正しいがAppDataではないJSON(配列が欠けている)も初期状態へフォールバックする', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects: [] }));
    expect(loadData()).toEqual({ projects: [], candidates: [], decisions: [] });
  });
});

describe('Project CRUD', () => {
  it('Projectを作成できる', () => {
    const project = createProject('白子町次期総合計画', '提案書のたたき台比較');
    expect(project.title).toBe('白子町次期総合計画');
    expect(project.context).toBe('提案書のたたき台比較');
    expect(project.id).toBeTruthy();
    expect(project.createdAt).toBe(project.updatedAt);
    expect(listProjects()).toHaveLength(1);
  });

  it('Projectを更新できる', async () => {
    const project = createProject('タイトルA');
    await new Promise((resolve) => setTimeout(resolve, 2));
    const updated = updateProject(project.id, { title: 'タイトルB' });
    expect(updated?.title).toBe('タイトルB');
    expect(getProject(project.id)?.title).toBe('タイトルB');
    expect(updated?.updatedAt).not.toBe(project.updatedAt);
  });

  it('Projectを削除できる', () => {
    const project = createProject('削除される案件');
    addCandidate(project.id, 'ChatGPT', '回答1');
    saveDecision(project.id, { selectedResponseId: 'dummy', reason: 'テスト理由' });

    deleteProject(project.id);

    expect(getProject(project.id)).toBeUndefined();
    expect(listCandidates(project.id)).toHaveLength(0);
    expect(getDecision(project.id)).toBeUndefined();
  });

  it('listProjectsはupdatedAtの降順で返す', async () => {
    const first = createProject('先に作った案件');
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = createProject('後で作った案件');

    const list = listProjects();
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);
  });
});

describe('CandidateResponse CRUD', () => {
  it('CandidateResponseを追加・更新・削除できる', () => {
    const project = createProject('比較したい案件');

    const c1 = addCandidate(project.id, 'ChatGPT', 'ChatGPTの回答');
    const c2 = addCandidate(project.id, 'Claude', 'Claudeの回答');
    expect(listCandidates(project.id)).toHaveLength(2);
    expect(c1.order).toBe(0);
    expect(c2.order).toBe(1);

    const updated = updateCandidate(c1.id, { content: '修正後のChatGPT回答' });
    expect(updated?.content).toBe('修正後のChatGPT回答');

    deleteCandidate(c1.id);
    const remaining = listCandidates(project.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(c2.id);
  });

  it('採用中の候補は削除できない(Day4: 決定済みCandidateの削除拒否)', () => {
    const project = createProject('決定込みの案件');
    const candidate = addCandidate(project.id, 'Gemini', 'Geminiの回答');
    saveDecision(project.id, { selectedResponseId: candidate.id, reason: '一番具体的だったため' });
    expect(getDecision(project.id)).toBeDefined();

    expect(() => deleteCandidate(candidate.id)).toThrow();

    expect(getDecision(project.id)?.selectedResponseId).toBe(candidate.id);
    expect(listCandidates(project.id)).toHaveLength(1);
  });
});

describe('Decision', () => {
  it('Decisionを保存・更新できる', () => {
    const project = createProject('決定を記録する案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    const c2 = addCandidate(project.id, 'Claude', '回答B');

    const saved = saveDecision(project.id, {
      selectedResponseId: c1.id,
      reason: '具体性が高かったため',
      decisionSummary: '回答Aを採用',
    });
    expect(saved.selectedResponseId).toBe(c1.id);
    expect(getDecision(project.id)?.selectedResponseId).toBe(c1.id);

    const updated = saveDecision(project.id, {
      selectedResponseId: c2.id,
      reason: 'やっぱりこちらの方が具体的だった',
    });
    expect(updated.selectedResponseId).toBe(c2.id);

    const all = loadData().decisions.filter((d) => d.projectId === project.id);
    expect(all).toHaveLength(1);
    expect(getDecision(project.id)?.selectedResponseId).toBe(c2.id);
  });
});

describe('Day2: 案件一覧', () => {
  it('空タイトルでは案件を作成できない', () => {
    expect(() => createProject('')).toThrow();
    expect(() => createProject('   ')).toThrow();
  });

  it('タイトルとcontext付きで案件を作成できる(前後の空白は除去される)', () => {
    const project = createProject('  白子町案件  ', '  背景メモ  ');
    expect(project.title).toBe('白子町案件');
    expect(project.context).toBe('背景メモ');
  });

  it('listProjectsWithSummaryもupdatedAtの降順で返す', async () => {
    const first = createProject('先に作った案件');
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = createProject('後で作った案件');

    const list = listProjectsWithSummary();
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);
  });

  it('Decisionの有無でisDecidedが切り替わる', () => {
    const project = createProject('決定判定の案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答');

    let summary = listProjectsWithSummary().find((p) => p.id === project.id);
    expect(summary?.isDecided).toBe(false);
    expect(summary?.candidateCount).toBe(1);

    saveDecision(project.id, { selectedResponseId: candidate.id, reason: '一番良かったため' });

    summary = listProjectsWithSummary().find((p) => p.id === project.id);
    expect(summary?.isDecided).toBe(true);
  });

  it('Project削除時にCandidateResponseとDecisionも削除され、他案件には影響しない', () => {
    const target = createProject('削除対象案件');
    const other = createProject('残る案件');
    const targetCandidate = addCandidate(target.id, 'ChatGPT', '回答A');
    addCandidate(other.id, 'Claude', '回答B');
    saveDecision(target.id, { selectedResponseId: targetCandidate.id, reason: '理由' });

    deleteProject(target.id);

    expect(getProject(target.id)).toBeUndefined();
    expect(listCandidates(target.id)).toHaveLength(0);
    expect(getDecision(target.id)).toBeUndefined();

    expect(getProject(other.id)).toBeDefined();
    expect(listCandidates(other.id)).toHaveLength(1);
  });

  it('CandidateResponseの追加・更新・削除でProject.updatedAtが更新される', async () => {
    const project = createProject('updatedAt確認案件');
    const afterCreate = project.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 2));
    const candidate = addCandidate(project.id, 'ChatGPT', '回答');
    const afterAdd = getProject(project.id)?.updatedAt;
    expect(afterAdd).not.toBe(afterCreate);

    await new Promise((resolve) => setTimeout(resolve, 2));
    updateCandidate(candidate.id, { content: '修正後' });
    const afterUpdate = getProject(project.id)?.updatedAt;
    expect(afterUpdate).not.toBe(afterAdd);

    await new Promise((resolve) => setTimeout(resolve, 2));
    deleteCandidate(candidate.id);
    const afterDelete = getProject(project.id)?.updatedAt;
    expect(afterDelete).not.toBe(afterUpdate);
  });

  it('Decision保存時にProject.updatedAtが更新される', async () => {
    const project = createProject('決定でupdatedAt確認');
    const candidate = addCandidate(project.id, 'Gemini', '回答');
    const beforeDecision = getProject(project.id)?.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 2));
    saveDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' });

    const afterDecision = getProject(project.id)?.updatedAt;
    expect(afterDecision).not.toBe(beforeDecision);
  });
});

describe('Day3: 候補回答の追加・比較表示', () => {
  it('content空文字ではCandidateResponseを追加できない', () => {
    const project = createProject('候補追加テスト案件');
    expect(() => addCandidate(project.id, 'ChatGPT', '')).toThrow();
    expect(() => addCandidate(project.id, 'ChatGPT', '   ')).toThrow();
    expect(listCandidates(project.id)).toHaveLength(0);
  });

  it('source未指定では追加できない', () => {
    const project = createProject('候補追加テスト案件2');
    expect(() => addCandidate(project.id, '', '回答本文')).toThrow();
    expect(() => addCandidate(project.id, '   ', '回答本文')).toThrow();
    expect(listCandidates(project.id)).toHaveLength(0);
  });

  it('contentとsourceがtrimされる', () => {
    const project = createProject('trim確認案件');
    const candidate = addCandidate(project.id, '  ChatGPT  ', '  前後に空白のある回答  ');
    expect(candidate.source).toBe('ChatGPT');
    expect(candidate.content).toBe('前後に空白のある回答');
  });

  it('order順で取得される', () => {
    const project = createProject('order確認案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '1件目');
    const c2 = addCandidate(project.id, 'Claude', '2件目');
    const c3 = addCandidate(project.id, 'Gemini', '3件目');

    const list = listCandidates(project.id);
    expect(list.map((c) => c.id)).toEqual([c1.id, c2.id, c3.id]);
  });

  it('更新時に他回答へ影響しない', () => {
    const project = createProject('更新影響確認案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答1');
    const c2 = addCandidate(project.id, 'Claude', '回答2');

    updateCandidate(c1.id, { content: '更新後の回答1' });

    const list = listCandidates(project.id);
    expect(list.find((c) => c.id === c1.id)?.content).toBe('更新後の回答1');
    expect(list.find((c) => c.id === c2.id)?.content).toBe('回答2');
  });

  it('削除時に他回答へ影響しない', () => {
    const project = createProject('削除影響確認案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答1');
    const c2 = addCandidate(project.id, 'Claude', '回答2');

    deleteCandidate(c1.id);

    const list = listCandidates(project.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(c2.id);
    expect(list[0].content).toBe('回答2');
  });
});

describe('Day4: 決定記録(createDecision/updateDecision/deleteDecision)', () => {
  it('createDecisionで決定を保存できる(reason/decisionSummaryはtrimされる)', () => {
    const project = createProject('決定保存案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');

    const decision = createDecision(project.id, {
      selectedResponseId: candidate.id,
      reason: '  具体性が高かったため  ',
      decisionSummary: '  ChatGPT案を採用  ',
    });

    expect(decision.reason).toBe('具体性が高かったため');
    expect(decision.decisionSummary).toBe('ChatGPT案を採用');
    expect(getDecision(project.id)?.selectedResponseId).toBe(candidate.id);
  });

  it('decisionSummaryを省略した場合は空文字で保存される', () => {
    const project = createProject('要約省略案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');

    const decision = createDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' });

    expect(decision.decisionSummary).toBe('');
  });

  it('reasonが空文字では作成できない', () => {
    const project = createProject('reason空文字案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');

    expect(() => createDecision(project.id, { selectedResponseId: candidate.id, reason: '' })).toThrow();
    expect(getDecision(project.id)).toBeUndefined();
  });

  it('reasonが空白のみでは作成できない', () => {
    const project = createProject('reason空白案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');

    expect(() => createDecision(project.id, { selectedResponseId: candidate.id, reason: '   ' })).toThrow();
    expect(getDecision(project.id)).toBeUndefined();
  });

  it('存在しないprojectIdでは作成できない', () => {
    expect(() =>
      createDecision('not-exist-project', { selectedResponseId: 'not-exist-candidate', reason: '理由' }),
    ).toThrow();
  });

  it('存在しないcandidateIdでは作成できない', () => {
    const project = createProject('存在しないcandidate案件');

    expect(() =>
      createDecision(project.id, { selectedResponseId: 'not-exist-candidate', reason: '理由' }),
    ).toThrow();
  });

  it('他projectのcandidateは採用できない', () => {
    const projectA = createProject('案件A');
    const projectB = createProject('案件B');
    const candidateOfB = addCandidate(projectB.id, 'ChatGPT', '案件Bの回答');

    expect(() =>
      createDecision(projectA.id, { selectedResponseId: candidateOfB.id, reason: '理由' }),
    ).toThrow();
    expect(getDecision(projectA.id)).toBeUndefined();
  });

  it('同一projectに既に決定がある場合、createDecisionは拒否される', () => {
    const project = createProject('重複決定案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    const c2 = addCandidate(project.id, 'Claude', '回答B');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '最初の理由' });

    expect(() => createDecision(project.id, { selectedResponseId: c2.id, reason: '別の理由' })).toThrow();
    expect(getDecision(project.id)?.selectedResponseId).toBe(c1.id);
  });

  it('updateDecisionで既存の決定を更新できる(採用candidateの変更・trimも行われる)', () => {
    const project = createProject('更新案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    const c2 = addCandidate(project.id, 'Claude', '回答B');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '最初の理由' });

    const updated = updateDecision(project.id, {
      selectedResponseId: c2.id,
      reason: '  やっぱりこちら  ',
      decisionSummary: '  変更後の要約  ',
    });

    expect(updated.selectedResponseId).toBe(c2.id);
    expect(updated.reason).toBe('やっぱりこちら');
    expect(updated.decisionSummary).toBe('変更後の要約');
    expect(loadData().decisions.filter((d) => d.projectId === project.id)).toHaveLength(1);
  });

  it('決定が存在しない案件へのupdateDecisionは拒否される', () => {
    const project = createProject('未決定案件への更新');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');

    expect(() => updateDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' })).toThrow();
  });

  it('updateDecisionもreason必須・候補所属チェックを行う', () => {
    const project = createProject('更新バリデーション案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');
    createDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' });

    expect(() => updateDecision(project.id, { selectedResponseId: candidate.id, reason: '   ' })).toThrow();
    expect(() => updateDecision(project.id, { selectedResponseId: 'not-exist', reason: '理由' })).toThrow();
  });

  it('deleteDecisionで決定を削除でき、案件・候補は残る', () => {
    const project = createProject('決定削除案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');
    createDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' });

    deleteDecision(project.id);

    expect(getDecision(project.id)).toBeUndefined();
    expect(getProject(project.id)).toBeDefined();
    expect(listCandidates(project.id)).toHaveLength(1);
  });

  it('deleteDecisionは他projectの決定に影響しない', () => {
    const projectA = createProject('削除対象案件');
    const projectB = createProject('影響を受けない案件');
    const cA = addCandidate(projectA.id, 'ChatGPT', '回答A');
    const cB = addCandidate(projectB.id, 'Claude', '回答B');
    createDecision(projectA.id, { selectedResponseId: cA.id, reason: '理由A' });
    createDecision(projectB.id, { selectedResponseId: cB.id, reason: '理由B' });

    deleteDecision(projectA.id);

    expect(getDecision(projectA.id)).toBeUndefined();
    expect(getDecision(projectB.id)?.selectedResponseId).toBe(cB.id);
  });

  it('決定をやり直した後(deleteDecision)は、その候補を削除できる', () => {
    const project = createProject('やり直し後削除可能案件');
    const candidate = addCandidate(project.id, 'Gemini', 'Geminiの回答');
    createDecision(project.id, { selectedResponseId: candidate.id, reason: '理由' });

    deleteDecision(project.id);

    expect(() => deleteCandidate(candidate.id)).not.toThrow();
    expect(listCandidates(project.id)).toHaveLength(0);
  });

  it('既存データ互換: Day4以前の形式で書き込まれたdecisionsもgetDecision/listProjectsWithSummaryで正しく読める', () => {
    const project = createProject('既存データ互換案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');
    // Day4以前のsaveDecision(バリデーションなしの直接書き込み)を再現
    const legacyData = loadData();
    legacyData.decisions.push({
      projectId: project.id,
      selectedResponseId: candidate.id,
      reason: '互換性確認用の理由',
      decisionSummary: '',
      decidedAt: new Date().toISOString(),
    });
    saveData(legacyData);

    expect(getDecision(project.id)?.reason).toBe('互換性確認用の理由');
    expect(listProjectsWithSummary().find((p) => p.id === project.id)?.isDecided).toBe(true);
    expect(() =>
      createDecision(project.id, { selectedResponseId: candidate.id, reason: '新しい理由' }),
    ).toThrow();
  });
});

describe('全データ削除', () => {
  it('clearAllDataで初期状態に戻る', () => {
    createProject('消える案件');
    expect(listProjects()).toHaveLength(1);

    clearAllData();

    expect(loadData()).toEqual({ projects: [], candidates: [], decisions: [] });
  });
});

describe('JSONエクスポート・インポート', () => {
  it('エクスポートしたJSONをインポートするとデータが復元される', () => {
    const project = createProject('エクスポート対象の案件');
    addCandidate(project.id, 'ChatGPT', 'エクスポートされる回答');

    const json = exportData();
    clearAllData();
    expect(listProjects()).toHaveLength(0);

    const ok = importData(json);

    expect(ok).toBe(true);
    expect(listProjects()).toHaveLength(1);
    expect(listCandidates(project.id)).toHaveLength(1);
  });

  it('不正なJSONをインポートした場合は失敗し、既存データを壊さない', () => {
    const project = createProject('守られるべき案件');

    const ok = importData('{ this is not json');

    expect(ok).toBe(false);
    expect(listProjects()).toHaveLength(1);
    expect(getProject(project.id)).toBeDefined();
  });
});
