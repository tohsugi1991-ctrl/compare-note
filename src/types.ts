export interface Project {
  id: string;
  title: string;
  context: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateResponse {
  id: string;
  projectId: string;
  source: string;
  content: string;
  order: number;
}

// sourceは自由文字列で保存するが、UIの選択肢はこの候補+Other(自由入力)から選ぶ
export const CANDIDATE_SOURCE_OPTIONS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Copilot',
  'Perplexity',
  'Other',
] as const;

export type CandidateSourceOption = (typeof CANDIDATE_SOURCE_OPTIONS)[number];

export interface Decision {
  projectId: string;
  selectedResponseId: string;
  decisionSummary: string;
  reason: string;
  decidedAt: string;
}

export interface AppData {
  projects: Project[];
  candidates: CandidateResponse[];
  decisions: Decision[];
}

export interface ProjectSummary extends Project {
  candidateCount: number;
  isDecided: boolean;
}
