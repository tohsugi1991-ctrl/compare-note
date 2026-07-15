import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCandidate, createDecision, createProject } from '../lib/storage';
import { ProjectsScreen } from './ProjectsScreen';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('ProjectsScreen', () => {
  it('案件が0件のときは空状態を表示する', () => {
    render(<ProjectsScreen onOpenProject={vi.fn()} />);
    expect(screen.getByText('まだ案件がありません')).toBeDefined();
    expect(screen.getByText('複数AIの回答を比較して、採用理由を残せます')).toBeDefined();
  });

  it('空タイトルでは作成ボタンが無効化され、案件を作成できない', async () => {
    const user = userEvent.setup();
    const onOpenProject = vi.fn();
    render(<ProjectsScreen onOpenProject={onOpenProject} />);

    await user.click(screen.getByRole('button', { name: '+ 最初の案件を作る' }));
    const submitButton = screen.getByRole('button', { name: '作成' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    await user.click(submitButton);
    expect(onOpenProject).not.toHaveBeenCalled();
  });

  it('タイトルとcontextを入力して案件を作成すると詳細画面へ遷移する', async () => {
    const user = userEvent.setup();
    const onOpenProject = vi.fn();
    render(<ProjectsScreen onOpenProject={onOpenProject} />);

    await user.click(screen.getByRole('button', { name: '+ 最初の案件を作る' }));
    await user.type(screen.getByLabelText('タイトル'), '白子町次期総合計画');
    await user.type(screen.getByLabelText('context(任意)'), '提案書の比較');
    await user.click(screen.getByRole('button', { name: '作成' }));

    expect(onOpenProject).toHaveBeenCalledTimes(1);
  });

  it('Escapeキーでフォームを閉じられる', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen onOpenProject={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '+ 最初の案件を作る' }));
    expect(screen.getByLabelText('タイトル')).toBeDefined();

    await user.type(screen.getByLabelText('タイトル'), '途中まで入力{Escape}');

    expect(screen.queryByLabelText('タイトル')).toBeNull();
  });

  it('作成済みの案件カードに更新日・回答件数・未決定バッジが表示される', () => {
    createProject('テスト案件', '背景メモ');
    render(<ProjectsScreen onOpenProject={vi.fn()} />);

    expect(screen.getByText('テスト案件')).toBeDefined();
    expect(screen.getByText('未決定')).toBeDefined();
    expect(screen.getByText(/回答 0件/)).toBeDefined();
    expect(screen.getByText('背景メモ')).toBeDefined();
  });

  it('削除確認でOKすると案件が一覧から消える', async () => {
    const user = userEvent.setup();
    createProject('削除される案件');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProjectsScreen onOpenProject={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '削除される案件を削除' }));

    expect(screen.queryByText('削除される案件')).toBeNull();
    vi.restoreAllMocks();
  });

  it('削除確認でキャンセルすると案件は残る', async () => {
    const user = userEvent.setup();
    createProject('残る案件');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProjectsScreen onOpenProject={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '残る案件を削除' }));

    expect(screen.getByText('残る案件')).toBeDefined();
    vi.restoreAllMocks();
  });

  it('Decisionを保存した案件は一覧で「決定済み」バッジになり、未決定案件は「未決定」のまま', () => {
    const decidedProject = createProject('決定済み一覧案件');
    const candidate = addCandidate(decidedProject.id, 'ChatGPT', '回答A');
    createDecision(decidedProject.id, { selectedResponseId: candidate.id, reason: '理由' });
    createProject('比較中の一覧案件');

    render(<ProjectsScreen onOpenProject={vi.fn()} />);

    expect(screen.getByText('決定済み')).toBeDefined();
    expect(screen.getByText('未決定')).toBeDefined();
    expect(screen.getByText(/回答 1件/)).toBeDefined();
  });

  it('複数案件がある場合、updatedAtの降順で表示される', async () => {
    createProject('先に作った案件');
    await new Promise((resolve) => setTimeout(resolve, 2));
    createProject('後で作った案件');

    render(<ProjectsScreen onOpenProject={vi.fn()} />);
    const titles = screen.getAllByRole('button').map((el) => el.textContent ?? '');
    const firstIndex = titles.findIndex((t) => t.includes('先に作った案件'));
    const secondIndex = titles.findIndex((t) => t.includes('後で作った案件'));
    expect(secondIndex).toBeLessThan(firstIndex);
  });
});
