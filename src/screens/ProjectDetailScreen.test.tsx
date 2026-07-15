import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCandidate, createDecision, createProject } from '../lib/storage';
import * as storageLib from '../lib/storage';
import { ProjectDetailScreen } from './ProjectDetailScreen';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('ProjectDetailScreen', () => {
  it('案件タイトル・context・未決定バッジが表示される', () => {
    const project = createProject('比較したい案件', '背景メモ');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('比較したい案件')).toBeDefined();
    expect(screen.getByText('背景メモ')).toBeDefined();
    expect(screen.getByText('未決定')).toBeDefined();
    expect(screen.getByText(/回答 0件/)).toBeDefined();
  });

  it('回答0件時の空状態が表示される', () => {
    const project = createProject('空状態案件');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('まだ回答がありません')).toBeDefined();
  });

  it('source/contentを入力して回答を追加できる', async () => {
    const user = userEvent.setup();
    const project = createProject('追加テスト案件');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('source'), 'ChatGPT');
    await user.type(screen.getByLabelText('content'), 'ChatGPTの回答本文');
    await user.click(screen.getByRole('button', { name: '+ 回答を追加' }));

    expect(screen.getByText('ChatGPTの回答本文')).toBeDefined();
    expect(screen.getByText(/回答 1件/)).toBeDefined();
  });

  it('Otherのsource名を指定できる', async () => {
    const user = userEvent.setup();
    const project = createProject('Otherテスト案件');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('source'), 'Other');
    await user.type(screen.getByLabelText('new-candidate-other-source'), 'Grok');
    await user.type(screen.getByLabelText('content'), 'Grokの回答本文');
    await user.click(screen.getByRole('button', { name: '+ 回答を追加' }));

    expect(screen.getByText('Grok')).toBeDefined();
    expect(screen.getByText('Grokの回答本文')).toBeDefined();
  });

  it('空contentでは追加できない', async () => {
    const user = userEvent.setup();
    const project = createProject('空content案件');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('source'), 'ChatGPT');
    const submitButton = screen.getByRole('button', { name: '+ 回答を追加' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    await user.type(screen.getByLabelText('content'), '   ');
    expect(submitButton.disabled).toBe(true);
    expect(screen.getByText(/回答 0件/)).toBeDefined();
  });

  it('複数回答が表示される', () => {
    const project = createProject('複数回答案件');
    addCandidate(project.id, 'ChatGPT', 'ChatGPTの回答');
    addCandidate(project.id, 'Claude', 'Claudeの回答');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('ChatGPTの回答')).toBeDefined();
    expect(screen.getByText('Claudeの回答')).toBeDefined();
    expect(screen.getByText(/回答 2件/)).toBeDefined();
  });

  it('長文・改行を含む回答も崩れず表示される', () => {
    const project = createProject('長文案件');
    const longContent = '1行目\n2行目\n3行目\n' + 'とても長い文章。'.repeat(50);
    addCandidate(project.id, 'ChatGPT', longContent);
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    const contentEl = screen.getByText((_, element) => element?.textContent === longContent);
    expect(contentEl.className).toContain('whitespace-pre-wrap');
  });

  it('回答を編集できる', async () => {
    const user = userEvent.setup();
    const project = createProject('編集テスト案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '編集前の回答');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /を編集/ }));

    const card = within(screen.getByTestId(`candidate-card-${candidate.id}`));
    const contentBox = card.getByLabelText('content');
    await user.clear(contentBox);
    await user.type(contentBox, '編集後の回答');
    await user.click(card.getByRole('button', { name: '保存' }));

    expect(screen.getByText('編集後の回答')).toBeDefined();
    expect(screen.queryByText('編集前の回答')).toBeNull();
  });

  it('回答を編集してもキャンセルすれば変更されない', async () => {
    const user = userEvent.setup();
    const project = createProject('編集キャンセル案件');
    addCandidate(project.id, 'ChatGPT', '元の回答');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /を編集/ }));
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(screen.getByText('元の回答')).toBeDefined();
  });

  it('回答を削除できる', async () => {
    const user = userEvent.setup();
    const project = createProject('削除テスト案件');
    addCandidate(project.id, 'ChatGPT', '削除される回答');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /を削除/ }));

    expect(screen.queryByText('削除される回答')).toBeNull();
    expect(screen.getByText(/回答 0件/)).toBeDefined();
    vi.restoreAllMocks();
  });

  it('削除確認でキャンセルすると回答は残る', async () => {
    const user = userEvent.setup();
    const project = createProject('削除キャンセル案件');
    addCandidate(project.id, 'ChatGPT', '残る回答');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /を削除/ }));

    expect(screen.getByText('残る回答')).toBeDefined();
    vi.restoreAllMocks();
  });

  it('存在しない案件IDで安全な画面が表示される', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ProjectDetailScreen projectId="not-exist-id" onBack={onBack} />);

    expect(screen.getByText('案件が見つかりません')).toBeDefined();

    await user.click(screen.getByRole('button', { name: '← 一覧に戻る' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('ProjectDetailScreen: Day4 決定記録', () => {
  it('候補が0件のときは決定フォームを表示しない', () => {
    const project = createProject('候補0件案件');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.queryByLabelText('この回答を採用する理由')).toBeNull();
    expect(screen.queryByLabelText('この回答を採用')).toBeNull();
  });

  it('候補が1件でも採用選択できる', async () => {
    const user = userEvent.setup();
    const project = createProject('候補1件案件');
    addCandidate(project.id, 'ChatGPT', '唯一の回答');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    const radio = screen.getByLabelText('この回答を採用') as HTMLInputElement;
    await user.click(radio);

    expect(radio.checked).toBe(true);
  });

  it('候補未選択では決定を保存できない', () => {
    const project = createProject('未選択案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: '決定を保存' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('reason未入力では決定を保存できない', async () => {
    const user = userEvent.setup();
    const project = createProject('reason未入力案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByLabelText('この回答を採用'));

    const saveButton = screen.getByRole('button', { name: '決定を保存' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('空白のみのreasonでは決定を保存できない', async () => {
    const user = userEvent.setup();
    const project = createProject('空白reason案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByLabelText('この回答を採用'));
    await user.type(screen.getByLabelText('この回答を採用する理由'), '   ');

    const saveButton = screen.getByRole('button', { name: '決定を保存' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('候補選択・reason・decisionSummaryを入力して決定を保存できる', async () => {
    const user = userEvent.setup();
    const project = createProject('正常保存案件');
    addCandidate(project.id, 'ChatGPT', '採用したい回答');
    addCandidate(project.id, 'Claude', 'もう一方の回答');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    const radios = screen.getAllByLabelText('この回答を採用');
    await user.click(radios[0]);
    await user.type(screen.getByLabelText('この回答を採用する理由'), '具体性が高かったため');
    await user.type(screen.getByLabelText('決定内容の要約(任意)'), 'ChatGPT案を採用');
    await user.click(screen.getByRole('button', { name: '決定を保存' }));

    expect(screen.getByText('決定済み')).toBeDefined();
    expect(screen.getByText('具体性が高かったため')).toBeDefined();
    expect(screen.getByText('ChatGPT案を採用')).toBeDefined();
  });

  it('決定保存は二重送信されない(保存後はフォームが消え再送信できない)', async () => {
    const user = userEvent.setup();
    const project = createProject('二重送信防止案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    const spy = vi.spyOn(storageLib, 'createDecision');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByLabelText('この回答を採用'));
    await user.type(screen.getByLabelText('この回答を採用する理由'), '理由A');
    await user.click(screen.getByRole('button', { name: '決定を保存' }));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: '決定を保存' })).toBeNull();
    spy.mockRestore();
  });

  it('決定保存に失敗した場合はフォーム内にエラーが表示される', async () => {
    const user = userEvent.setup();
    const project = createProject('保存失敗案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    const spy = vi.spyOn(storageLib, 'createDecision').mockImplementation(() => {
      throw new Error('保存できませんでした。データ量が多すぎる可能性があります');
    });
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByLabelText('この回答を採用'));
    await user.type(screen.getByLabelText('この回答を採用する理由'), '理由A');
    await user.click(screen.getByRole('button', { name: '決定を保存' }));

    expect(screen.getByText('保存できませんでした。データ量が多すぎる可能性があります')).toBeDefined();
    expect(screen.getByRole('button', { name: '決定を保存' })).toBeDefined();
    spy.mockRestore();
  });

  it('決定済み状態で採用source・content・reason・decisionSummaryが表示される', () => {
    const project = createProject('決定済み表示案件');
    const c1 = addCandidate(project.id, 'ChatGPT', 'ChatGPTの採用された回答');
    addCandidate(project.id, 'Claude', 'Claudeの回答');
    createDecision(project.id, {
      selectedResponseId: c1.id,
      reason: '一番実装イメージが具体的だったため',
      decisionSummary: 'ChatGPT案をベースに微修正して採用',
    });
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('決定済み')).toBeDefined();
    expect(screen.getByText('採用元: ChatGPT')).toBeDefined();
    // 採用サマリーと比較した他の候補の両方に表示されるため2箇所ヒットする(候補を非表示にしない仕様)
    expect(screen.getAllByText('ChatGPTの採用された回答').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('一番実装イメージが具体的だったため')).toBeDefined();
    expect(screen.getByText('ChatGPT案をベースに微修正して採用')).toBeDefined();
  });

  it('decisionSummaryが空の場合は要約欄を表示しない', () => {
    const project = createProject('要約なし案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '理由のみ' });
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('理由のみ')).toBeDefined();
    expect(screen.queryByText('要約:')).toBeNull();
  });

  it('画面を再マウントしても決定内容が保持される(リロード相当)', () => {
    const project = createProject('再マウント案件');
    const candidate = addCandidate(project.id, 'ChatGPT', '回答A');
    createDecision(project.id, { selectedResponseId: candidate.id, reason: '理由X', decisionSummary: '要約X' });

    const { unmount } = render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);
    expect(screen.getByText('理由X')).toBeDefined();
    unmount();

    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);
    expect(screen.getByText('理由X')).toBeDefined();
    expect(screen.getByText('要約X')).toBeDefined();
  });

  it('決定をやり直すと比較状態に戻り、候補は残る', async () => {
    const user = userEvent.setup();
    const project = createProject('やり直し案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '一旦採用した回答');
    addCandidate(project.id, 'Claude', 'もう一方の回答');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '一旦の理由' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '決定をやり直す' }));

    expect(screen.getByText('未決定')).toBeDefined();
    expect(screen.getByText('一旦採用した回答')).toBeDefined();
    expect(screen.getByText('もう一方の回答')).toBeDefined();
    expect(screen.getAllByLabelText('この回答を採用')).toHaveLength(2);
    vi.restoreAllMocks();
  });

  it('決定をやり直す際の確認をキャンセルすると決定済みのまま', async () => {
    const user = userEvent.setup();
    const project = createProject('やり直しキャンセル案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '理由' });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '決定をやり直す' }));

    expect(screen.getByText('決定済み')).toBeDefined();
    vi.restoreAllMocks();
  });

  it('採用済みの候補は削除ボタンが無効化される', () => {
    const project = createProject('採用済み削除不可案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '回答A');
    addCandidate(project.id, 'Claude', '回答B');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '理由' });
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    const card = within(screen.getByTestId(`candidate-card-${c1.id}`));
    const deleteButton = card.getByRole('button', { name: /を削除/ }) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);
  });

  it('決定済み状態でも他の候補は表示され続ける', () => {
    const project = createProject('他候補表示継続案件');
    const c1 = addCandidate(project.id, 'ChatGPT', '採用された回答');
    addCandidate(project.id, 'Claude', '採用されなかった回答');
    createDecision(project.id, { selectedResponseId: c1.id, reason: '理由' });
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getByText('採用されなかった回答')).toBeDefined();
  });

  it('モバイル幅でも決定フォームの主要要素が表示される', () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    const project = createProject('モバイル表示案件');
    addCandidate(project.id, 'ChatGPT', '回答A');
    addCandidate(project.id, 'Claude', '回答B');
    render(<ProjectDetailScreen projectId={project.id} onBack={vi.fn()} />);

    expect(screen.getAllByLabelText('この回答を採用')).toHaveLength(2);
    expect(screen.getByLabelText('この回答を採用する理由')).toBeDefined();
    expect(screen.getByRole('button', { name: '決定を保存' })).toBeDefined();
  });
});
