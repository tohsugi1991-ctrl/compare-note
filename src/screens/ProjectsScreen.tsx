import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { ProjectSummary } from '../types';
import { createProject, deleteProject, listProjectsWithSummary } from '../lib/storage';

interface ProjectsScreenProps {
  onOpenProject: (projectId: string) => void;
}

const CONTEXT_PREVIEW_LENGTH = 60;

export function ProjectsScreen({ onOpenProject }: ProjectsScreenProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>(() => listProjectsWithSummary());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openForm = () => {
    setTitle('');
    setContext('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setTitle('');
    setContext('');
  };

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const project = createProject(title, context);
    onOpenProject(project.id);
  };

  const handleFormKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeForm();
    }
  };

  const handleDelete = (project: ProjectSummary) => {
    const ok = window.confirm(`「${project.title}」を削除しますか?この操作は取り消せません。`);
    if (!ok) return;
    deleteProject(project.id);
    setProjects(listProjectsWithSummary());
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI比較ノート</h1>
        {!isFormOpen && (
          <button
            type="button"
            onClick={openForm}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            + 新しい案件
          </button>
        )}
      </header>

      <p className="mb-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        複数AIの回答を横に並べて比較し、選んだ理由を残せるノートです。
        <br />
        ChatGPT・Claude・Geminiなど複数のAIを使い分けている人向け。
        <br />
        「どの回答を採用したか、なぜか」を忘れて後で困る、をなくします。
      </p>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleFormKeyDown}
          className="mb-6 space-y-3 rounded-md border border-gray-300 p-4 dark:border-gray-700"
        >
          <div>
            <label htmlFor="new-project-title" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              タイトル
            </label>
            <input
              id="new-project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="案件のタイトル(必須)"
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="new-project-context" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              context(任意)
            </label>
            <input
              id="new-project-context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="案件の背景を一言で(任意)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              作成
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="mb-1 text-gray-700 dark:text-gray-300">まだ案件がありません</p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            複数AIの回答を比較して、採用理由を残せます
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={openForm}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              + 最初の案件を作る
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-start gap-2 rounded-md border border-gray-200 px-4 py-3 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
            >
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {project.title}
                  </span>
                  <span
                    className={
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (project.isDecided
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')
                    }
                  >
                    {project.isDecided ? '決定済み' : '未決定'}
                  </span>
                </div>
                {project.context && (
                  <div className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {project.context.slice(0, CONTEXT_PREVIEW_LENGTH)}
                    {project.context.length > CONTEXT_PREVIEW_LENGTH ? '…' : ''}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  更新: {new Date(project.updatedAt).toLocaleString('ja-JP')} ・ 回答{' '}
                  {project.candidateCount}件
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(project)}
                aria-label={`${project.title}を削除`}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 hover:text-red-600 dark:text-gray-600 dark:hover:text-red-400"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
