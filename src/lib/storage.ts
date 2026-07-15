import type { AppData, CandidateResponse, Decision, Project, ProjectSummary } from '../types';

const STORAGE_KEY = 'compare-note:v1';

export function createInitialData(): AppData {
  return { projects: [], candidates: [], decisions: [] };
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.projects) && Array.isArray(v.candidates) && Array.isArray(v.decisions);
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialData();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAppData(parsed) ? parsed : createInitialData();
  } catch {
    return createInitialData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nowIso(): string {
  return new Date().toISOString();
}

// --- Project ---

export function createProject(title: string, context = ''): Project {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error('タイトルは必須です');
  }
  const data = loadData();
  const timestamp = nowIso();
  const project: Project = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    context: context.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  data.projects.push(project);
  saveData(data);
  return project;
}

export function listProjects(): Project[] {
  return [...loadData().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listProjectsWithSummary(): ProjectSummary[] {
  const data = loadData();
  return [...data.projects]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((project) => ({
      ...project,
      candidateCount: data.candidates.filter((c) => c.projectId === project.id).length,
      isDecided: data.decisions.some((d) => d.projectId === project.id),
    }));
}

export function getProject(id: string): Project | undefined {
  return loadData().projects.find((p) => p.id === id);
}

export function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'title' | 'context'>>,
): Project | undefined {
  const data = loadData();
  const project = data.projects.find((p) => p.id === id);
  if (!project) return undefined;
  Object.assign(project, updates, { updatedAt: nowIso() });
  saveData(data);
  return project;
}

export function deleteProject(id: string): void {
  const data = loadData();
  data.projects = data.projects.filter((p) => p.id !== id);
  data.candidates = data.candidates.filter((c) => c.projectId !== id);
  data.decisions = data.decisions.filter((d) => d.projectId !== id);
  saveData(data);
}

// --- CandidateResponse ---

export function listCandidates(projectId: string): CandidateResponse[] {
  return loadData()
    .candidates.filter((c) => c.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export function addCandidate(projectId: string, source: string, content: string): CandidateResponse {
  const trimmedSource = source.trim();
  const trimmedContent = content.trim();
  if (!trimmedSource) {
    throw new Error('sourceは必須です');
  }
  if (!trimmedContent) {
    throw new Error('contentは必須です');
  }
  const data = loadData();
  const order = data.candidates.filter((c) => c.projectId === projectId).length;
  const candidate: CandidateResponse = {
    id: crypto.randomUUID(),
    projectId,
    source: trimmedSource,
    content: trimmedContent,
    order,
  };
  data.candidates.push(candidate);
  const project = data.projects.find((p) => p.id === projectId);
  if (project) project.updatedAt = nowIso();
  saveData(data);
  return candidate;
}

export function updateCandidate(
  id: string,
  updates: Partial<Pick<CandidateResponse, 'source' | 'content'>>,
): CandidateResponse | undefined {
  const data = loadData();
  const candidate = data.candidates.find((c) => c.id === id);
  if (!candidate) return undefined;
  Object.assign(candidate, updates);
  const project = data.projects.find((p) => p.id === candidate.projectId);
  if (project) project.updatedAt = nowIso();
  saveData(data);
  return candidate;
}

export function deleteCandidate(id: string): void {
  const data = loadData();
  const candidate = data.candidates.find((c) => c.id === id);
  if (!candidate) return;
  const isAdopted = data.decisions.some(
    (d) => d.projectId === candidate.projectId && d.selectedResponseId === id,
  );
  if (isAdopted) {
    throw new Error('採用済みの回答は削除できません。先に決定をやり直してください');
  }
  data.candidates = data.candidates.filter((c) => c.id !== id);
  const project = data.projects.find((p) => p.id === candidate.projectId);
  if (project) project.updatedAt = nowIso();
  saveData(data);
}

// --- Decision ---
// Decisionはprojectごとに常に最大1件(上書き型・履歴なし)。
// saveDecisionはバリデーションなしの下位アップサート関数(既存テスト・他関数から直接呼ばれる想定で維持)。
// createDecision/updateDecisionはその上にバリデーションと「新規作成か更新か」の区別を乗せたラッパー。

export function getDecision(projectId: string): Decision | undefined {
  return loadData().decisions.find((d) => d.projectId === projectId);
}

export function saveDecision(
  projectId: string,
  input: { selectedResponseId: string; reason: string; decisionSummary?: string },
): Decision {
  const data = loadData();
  const decision: Decision = {
    projectId,
    selectedResponseId: input.selectedResponseId,
    reason: input.reason,
    decisionSummary: input.decisionSummary ?? '',
    decidedAt: nowIso(),
  };
  data.decisions = [...data.decisions.filter((d) => d.projectId !== projectId), decision];
  const project = data.projects.find((p) => p.id === projectId);
  if (project) project.updatedAt = nowIso();
  saveData(data);
  return decision;
}

function validateDecisionInput(
  projectId: string,
  input: { selectedResponseId: string; reason: string; decisionSummary?: string },
): { selectedResponseId: string; reason: string; decisionSummary: string } {
  const data = loadData();
  if (!data.projects.some((p) => p.id === projectId)) {
    throw new Error('案件が見つかりません');
  }
  const candidate = data.candidates.find((c) => c.id === input.selectedResponseId);
  if (!candidate || candidate.projectId !== projectId) {
    throw new Error('選択した回答がこの案件に見つかりません');
  }
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('採用理由は必須です');
  }
  return {
    selectedResponseId: input.selectedResponseId,
    reason,
    decisionSummary: (input.decisionSummary ?? '').trim(),
  };
}

export function createDecision(
  projectId: string,
  input: { selectedResponseId: string; reason: string; decisionSummary?: string },
): Decision {
  if (getDecision(projectId)) {
    throw new Error('この案件にはすでに決定が保存されています。決定の編集から更新してください');
  }
  const validated = validateDecisionInput(projectId, input);
  return saveDecision(projectId, validated);
}

export function updateDecision(
  projectId: string,
  input: { selectedResponseId: string; reason: string; decisionSummary?: string },
): Decision {
  if (!getDecision(projectId)) {
    throw new Error('更新対象の決定が見つかりません');
  }
  const validated = validateDecisionInput(projectId, input);
  return saveDecision(projectId, validated);
}

export function deleteDecision(projectId: string): void {
  const data = loadData();
  if (!data.decisions.some((d) => d.projectId === projectId)) return;
  data.decisions = data.decisions.filter((d) => d.projectId !== projectId);
  const project = data.projects.find((p) => p.id === projectId);
  if (project) project.updatedAt = nowIso();
  saveData(data);
}

// --- 全体操作 ---

export function clearAllData(): void {
  saveData(createInitialData());
}

export function exportData(): string {
  return JSON.stringify(loadData(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isAppData(parsed)) return false;
    saveData(parsed);
    return true;
  } catch {
    return false;
  }
}
