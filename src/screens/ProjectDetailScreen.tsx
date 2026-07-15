import { useState, type FormEvent } from 'react';
import type { CandidateResponse, Decision } from '../types';
import { CANDIDATE_SOURCE_OPTIONS } from '../types';
import {
  addCandidate,
  createDecision,
  deleteCandidate,
  deleteDecision,
  getDecision,
  getProject,
  listCandidates,
  updateCandidate,
  updateDecision,
} from '../lib/storage';

interface ProjectDetailScreenProps {
  projectId: string;
  onBack: () => void;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100';
const labelClass = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400';

interface SourceFieldsProps {
  idPrefix: string;
  source: string;
  otherSource: string;
  onSourceChange: (value: string) => void;
  onOtherSourceChange: (value: string) => void;
}

function SourceFields({ idPrefix, source, otherSource, onSourceChange, onOtherSourceChange }: SourceFieldsProps) {
  return (
    <div>
      <label htmlFor={`${idPrefix}-source`} className={labelClass}>
        source
      </label>
      <select
        id={`${idPrefix}-source`}
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        className={inputClass}
      >
        <option value="">選択してください</option>
        {CANDIDATE_SOURCE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {source === 'Other' && (
        <input
          type="text"
          value={otherSource}
          onChange={(e) => onOtherSourceChange(e.target.value)}
          placeholder="sourceの名前を入力"
          aria-label={`${idPrefix}-other-source`}
          className={`${inputClass} mt-2`}
        />
      )}
    </div>
  );
}

interface CandidateSelection {
  selected: boolean;
  onSelect: () => void;
}

interface CandidateCardProps {
  candidate: CandidateResponse;
  onChanged: () => void;
  className?: string;
  isAdopted?: boolean;
  selection?: CandidateSelection;
}

function CandidateCard({ candidate, onChanged, className = '', isAdopted = false, selection }: CandidateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSourceSelect, setEditSourceSelect] = useState('');
  const [editOtherSource, setEditOtherSource] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const label = `${candidate.order + 1}件目(${candidate.source})`;
  const radioId = `candidate-radio-${candidate.id}`;

  const startEdit = () => {
    const isKnownOption = (CANDIDATE_SOURCE_OPTIONS as readonly string[]).includes(candidate.source);
    setEditSourceSelect(isKnownOption ? candidate.source : 'Other');
    setEditOtherSource(isKnownOption ? '' : candidate.source);
    setEditContent(candidate.content);
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const effectiveEditSource = editSourceSelect === 'Other' ? editOtherSource.trim() : editSourceSelect;
  const canSave = effectiveEditSource !== '' && editContent.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    updateCandidate(candidate.id, { source: effectiveEditSource, content: editContent.trim() });
    setIsEditing(false);
    onChanged();
  };

  const handleDelete = () => {
    const ok = window.confirm(`${label}を削除しますか?この操作は取り消せません。`);
    if (!ok) return;
    try {
      deleteCandidate(candidate.id);
      onChanged();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '削除できませんでした');
    }
  };

  if (isEditing) {
    return (
      <div
        data-testid={`candidate-card-${candidate.id}`}
        className={`flex h-full flex-col gap-3 rounded-md border border-gray-300 p-4 dark:border-gray-700 ${className}`}
      >
        <SourceFields
          idPrefix={`edit-${candidate.id}`}
          source={editSourceSelect}
          otherSource={editOtherSource}
          onSourceChange={setEditSourceSelect}
          onOtherSourceChange={setEditOtherSource}
        />
        <div>
          <label htmlFor={`edit-${candidate.id}-content`} className={labelClass}>
            content
          </label>
          <textarea
            id={`edit-${candidate.id}-content`}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className={inputClass}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  const highlightClass = isAdopted
    ? 'border-emerald-500 ring-2 ring-emerald-400 dark:border-emerald-400 dark:ring-emerald-500'
    : selection?.selected
      ? 'border-gray-900 ring-2 ring-gray-900 dark:border-gray-100 dark:ring-gray-100'
      : 'border-gray-200 dark:border-gray-700';

  return (
    <div
      data-testid={`candidate-card-${candidate.id}`}
      className={`flex h-full flex-col rounded-md border p-4 ${highlightClass} ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{candidate.source}</span>
          {isAdopted && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              採用済み
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label={`${label}を編集`}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isAdopted}
            aria-label={`${label}を削除`}
            title={isAdopted ? '採用済みの回答は削除できません。先に決定をやり直してください' : undefined}
            className="rounded-md px-2 py-1 text-xs text-gray-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-400 dark:text-gray-600 dark:hover:text-red-400 dark:disabled:hover:text-gray-600"
          >
            削除
          </button>
        </div>
      </div>
      {selection && (
        <div className="mb-2 flex items-center gap-2">
          <input
            type="radio"
            id={radioId}
            name="decision-candidate"
            checked={selection.selected}
            onChange={selection.onSelect}
            className="h-4 w-4 accent-gray-900 dark:accent-gray-100"
          />
          <label htmlFor={radioId} className="text-sm text-gray-700 dark:text-gray-300">
            この回答を採用
          </label>
        </div>
      )}
      <div className="max-h-80 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
        {candidate.content}
      </div>
      {deleteError && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {deleteError}
        </p>
      )}
    </div>
  );
}

export function ProjectDetailScreen({ projectId, onBack }: ProjectDetailScreenProps) {
  const [project] = useState(() => getProject(projectId));
  const [candidates, setCandidates] = useState<CandidateResponse[]>(() => listCandidates(projectId));

  const [formSource, setFormSource] = useState('');
  const [formOtherSource, setFormOtherSource] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [decision, setDecision] = useState<Decision | undefined>(() => getDecision(projectId));
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [summaryInput, setSummaryInput] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [decisionFormError, setDecisionFormError] = useState<string | null>(null);
  const [decisionAnnouncement, setDecisionAnnouncement] = useState('');

  const refreshCandidates = () => setCandidates(listCandidates(projectId));
  const refreshDecision = () => setDecision(getDecision(projectId));

  const resetDecisionForm = () => {
    setIsEditingDecision(false);
    setSelectedCandidateId(null);
    setReasonInput('');
    setSummaryInput('');
    setDecisionFormError(null);
  };

  const startEditDecision = () => {
    if (!decision) return;
    setSelectedCandidateId(decision.selectedResponseId);
    setReasonInput(decision.reason);
    setSummaryInput(decision.decisionSummary);
    setDecisionFormError(null);
    setIsEditingDecision(true);
  };

  const canSubmitDecision = selectedCandidateId !== null && reasonInput.trim() !== '' && !isSavingDecision;

  const handleDecisionSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmitDecision || selectedCandidateId === null) return;
    setIsSavingDecision(true);
    setDecisionFormError(null);
    try {
      const input = { selectedResponseId: selectedCandidateId, reason: reasonInput, decisionSummary: summaryInput };
      if (decision) {
        updateDecision(projectId, input);
        setDecisionAnnouncement('決定を更新しました');
      } else {
        createDecision(projectId, input);
        setDecisionAnnouncement('決定を保存しました');
      }
      refreshDecision();
      resetDecisionForm();
    } catch (err) {
      setDecisionFormError(err instanceof Error ? err.message : '決定を保存できませんでした');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleRedoDecision = () => {
    const ok = window.confirm('決定をやり直しますか?保存されている採用理由は削除され、比較状態に戻ります。');
    if (!ok) return;
    deleteDecision(projectId);
    refreshDecision();
    resetDecisionForm();
    setDecisionAnnouncement('決定をやり直しました。比較状態に戻りました');
  };

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="mb-6 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    >
      ← 一覧に戻る
    </button>
  );

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        {backButton}
        <p className="text-gray-700 dark:text-gray-300">案件が見つかりません</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          削除された案件か、URLが正しくない可能性があります
        </p>
      </div>
    );
  }

  const isDecided = Boolean(decision);
  const adoptedCandidate = decision ? candidates.find((c) => c.id === decision.selectedResponseId) : undefined;
  const showDecisionForm = candidates.length > 0 && (!decision || isEditingDecision);
  const effectiveFormSource = formSource === 'Other' ? formOtherSource.trim() : formSource;
  const canSubmit = formSource !== '' && effectiveFormSource !== '' && formContent.trim() !== '' && !isSubmitting;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      addCandidate(projectId, effectiveFormSource, formContent);
      setFormSource('');
      setFormOtherSource('');
      setFormContent('');
      refreshCandidates();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '回答を追加できませんでした');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHorizontalScroll = candidates.length >= 3;
  const gridClass =
    candidates.length >= 3
      ? 'flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2'
      : candidates.length === 2
        ? 'flex flex-col gap-4 md:grid md:grid-cols-2'
        : 'flex flex-col gap-4';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {backButton}
      <p aria-live="polite" className="sr-only">
        {decisionAnnouncement}
      </p>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{project.title}</h1>
          <span
            className={
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
              (isDecided
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')
            }
          >
            {isDecided ? '決定済み' : '未決定'}
          </span>
        </div>
        {project.context && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{project.context}</p>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">回答 {candidates.length}件</p>
      </header>

      {decision && !isEditingDecision && (
        <div className="mb-8 rounded-md border-2 border-emerald-500 bg-emerald-50 p-4 dark:border-emerald-400 dark:bg-emerald-950/30">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">採用した回答</h2>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={startEditDecision}
                className="text-gray-600 underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                編集する
              </button>
              <button
                type="button"
                onClick={handleRedoDecision}
                className="text-gray-600 underline hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                決定をやり直す
              </button>
            </div>
          </div>
          {adoptedCandidate ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                採用元: {adoptedCandidate.source}
              </p>
              <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                {adoptedCandidate.content}
              </p>
            </>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">採用した回答が見つかりません</p>
          )}
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">採用理由: </span>
            <span className="whitespace-pre-wrap break-words">{decision.reason}</span>
          </p>
          {decision.decisionSummary && (
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">要約: </span>
              <span className="whitespace-pre-wrap break-words">{decision.decisionSummary}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            決定日時: {new Date(decision.decidedAt).toLocaleString('ja-JP')}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-3 rounded-md border border-gray-300 p-4 dark:border-gray-700"
      >
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">回答を追加</h2>
        <SourceFields
          idPrefix="new-candidate"
          source={formSource}
          otherSource={formOtherSource}
          onSourceChange={setFormSource}
          onOtherSourceChange={setFormOtherSource}
        />
        <div>
          <label htmlFor="new-candidate-content" className={labelClass}>
            content
          </label>
          <textarea
            id="new-candidate-content"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="AIの回答を貼り付け"
            rows={6}
            className={inputClass}
          />
        </div>
        {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
          >
            + 回答を追加
          </button>
        </div>
      </form>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300">まだ回答がありません</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            上のフォームからAIの回答を追加して比較を始めましょう
          </p>
        </div>
      ) : (
        <>
          {decision && !isEditingDecision && (
            <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">比較した他の候補</h2>
          )}
          <div className={gridClass}>
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onChanged={refreshCandidates}
                className={isHorizontalScroll ? 'md:w-80 md:shrink-0' : ''}
                isAdopted={decision?.selectedResponseId === candidate.id}
                selection={
                  showDecisionForm
                    ? {
                        selected: selectedCandidateId === candidate.id,
                        onSelect: () => setSelectedCandidateId(candidate.id),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </>
      )}

      {showDecisionForm && (
        <form
          onSubmit={handleDecisionSubmit}
          className="mt-8 space-y-3 rounded-md border border-gray-300 p-4 dark:border-gray-700"
        >
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {decision ? '決定を編集' : '採用する回答を決める'}
          </h2>
          <div>
            <label htmlFor="decision-reason" className={labelClass}>
              この回答を採用する理由
            </label>
            <textarea
              id="decision-reason"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="なぜこの回答を選びましたか?"
              rows={3}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="decision-summary" className={labelClass}>
              決定内容の要約(任意)
            </label>
            <textarea
              id="decision-summary"
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              placeholder="採用した内容の一言メモ(任意)"
              rows={2}
              className={inputClass}
            />
          </div>
          {decisionFormError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {decisionFormError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            {isEditingDecision && (
              <button
                type="button"
                onClick={resetDecisionForm}
                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmitDecision}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              {decision ? '更新を保存' : '決定を保存'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
