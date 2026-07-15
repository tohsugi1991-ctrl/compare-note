# resume.md — 次回このプロジェクトを再開するときに読むファイル

最終更新: 2026-07-15

## 読む順番

1. **このファイル(resume.md)** — 全体状況を1分で把握
2. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — 完了/未着手/今週やることの詳細
3. **[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md)** — Day1〜7の実装計画全体

## 今どこまで進んでいるか(1行)

**Day4(画面2 状態B: 決定記録・意思決定保存)完了。候補への採用選択(ラジオボタン、1件でも可)、reason必須・decisionSummary任意の決定フォーム、決定サマリーカード(採用元・content・reason・decisionSummary・決定日時)、「編集する」(再編集)・「決定をやり直す」(確認後に削除して状態Aへ)、採用済みcandidateの削除拒否を実装。ユニットテスト78件(storage.test.ts 41件+ProjectsScreen 9件+ProjectDetailScreen 28件)が全件パス、Playwrightで実ブラウザ動作(案件作成→候補2件追加→採用選択→reason/decisionSummary入力→決定保存→決定済み表示→リロード相当→一覧の決定済みバッジ確認→詳細再オープンで保持確認→決定をやり直す→未決定に復帰→モバイル375px確認)を確認済み。**

## 次に何をするか(1行)

**Day5「通し動作確認 + 自分自身での実案件投入(dogfooding)」に着手する**: 白子町次期総合計画・香取市案件など進行中の実案件のうち最低2件で実際にComparisonToDecisionフローを使い、UIの分かりにくい箇所・レスポンシブ崩れを修正、localStorage容量超過時や極端に長いテキスト貼り付け時の最低限のエラー表示を追加する。詳細は[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md) Day5節、[PROJECT_STATUS.md](./PROJECT_STATUS.md) 5節。

## 見失いやすい前提(再確認用)

- 画面は2つだけ(案件一覧/案件詳細)。ルーティングライブラリは使わない。画面切り替えは`App.tsx`のstateで行う設計([docs/issue-001_user_flow.md](./docs/issue-001_user_flow.md))。この設計上、ブラウザリロードは常に案件一覧へ戻る(URLに画面状態は載らない)。データはlocalStorageに残るため、一覧から再度開けば内容は保持されている
- `CandidateResponse.source`はUI上ChatGPT/Claude/Gemini/Copilot/Perplexity/Otherから選ぶが、保存値は自由文字列(`src/types.ts`の`CANDIDATE_SOURCE_OPTIONS`はUI選択肢の定数であり、データ型としてenum化してはいない)
- Decisionは1案件につき常に最大1件(上書き型・履歴を持たない)。`saveDecision`は保存と更新の両方を兼ねる下位のアップサート関数で、その上に検証付きの`createDecision`(新規作成、重複は拒否)・`updateDecision`(既存の更新のみ)・`deleteDecision`をDay4で追加した
- Day4から、採用済み(決定済み)のcandidateは削除できない(`deleteCandidate`が例外をthrow)。削除したい場合は先に「決定をやり直す」でDecisionを削除する必要がある
- 禁止機能: AI API連携・ログイン連携・Chrome拡張・チーム共有・通知・クラウド同期・課金・自動比較/要約/推薦など([docs/issue-001_mvp_spec.md](./docs/issue-001_mvp_spec.md) 6節)
- データはlocalStorageのみ。バックエンド・APIサーバー・認証・DBは追加しない方針
- 7日後の成功条件・Kill Criteriaは自動計測せず、初期10人への直接ヒアリングで判定する([docs/issue-001_validation_plan.md](./docs/issue-001_validation_plan.md))
- `createProject`はDay2からタイトル必須(空文字・空白のみは例外をthrow)。UIのフォームも合わせてボタンを無効化している(二重の防御)

## 既知の制約(Day4時点)

- ドラッグによる候補の並べ替えは未実装(`order`は追加順のまま固定)
- 一覧からのタイトル・context編集導線はまだない
- localStorageのQuotaExceededError時のエラー表示は未対応(Day5で追加予定)
- 決定後に採用candidateのcontent/sourceを編集すると、決定サマリーの表示内容も編集後のものに変わる(スナップショットは保存しない設計。ただし採用済みcandidateの削除自体は拒否されるため、Decisionの参照が壊れることはない)

## 関連プロジェクト

- [IdeaForge/founder-os](../IdeaForge/founder-os/) — Weekly ReviewがISSUE-001を推薦した元プロジェクト。tsconfig等の設定ファイルのみ雛形として参考にした(ロジックはコピーしていない)。Founder OS本体には機能追加しない方針
