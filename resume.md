# resume.md — 次回このプロジェクトを再開するときに読むファイル

最終更新: 2026-07-15

## 読む順番

1. **このファイル(resume.md)** — 全体状況を1分で把握
2. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — 完了/未着手/今週やることの詳細
3. **[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md)** — Day1〜7の実装計画全体

## 今どこまで進んでいるか(1行)

**Day5(実案件3件でのdogfooding + 改善点抽出)完了。白子町総合計画・香取市KPI診断・IdeaForge Phase6着手判断の3案件で、案件作成→候補2件登録→横並び比較→採用選択→採用理由記録→decisionSummary記録→一覧へ戻る→(別作業を挟んで再訪)→決定内容の即時理解、まで一通り確認。長文貼り付け(約16,000文字)もエラー・崩れなし。Must Fixは0件でコード変更なし(既存78件のユニットテストもDay4時点のまま)。Kill Criteria仮判定は4項目中0項目該当でピボット不要。詳細は[docs/day5_dogfooding_report.md](./docs/day5_dogfooding_report.md)・[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md)。**

## 次に何をするか(1行)

**Day6「Vercelへのデプロイ + 告知文の準備」に着手する**: 本番URLを確認し、favicon等の最低限の体裁を整え、「データはこのブラウザだけに保存されます」という一言をUIに追加、[docs/issue-001_launch_plan.md](./docs/issue-001_launch_plan.md)の告知文下書きを仕上げる。詳細は[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md) Day6節、[PROJECT_STATUS.md](./PROJECT_STATUS.md) 5節。余力があればDay5で見つけたSF-1(sourceプリセットに「Claude Code」を追加)を合間に着手してもよい(Must Fixではないため必須ではない)。

## 見失いやすい前提(再確認用)

- 画面は2つだけ(案件一覧/案件詳細)。ルーティングライブラリは使わない。画面切り替えは`App.tsx`のstateで行う設計([docs/issue-001_user_flow.md](./docs/issue-001_user_flow.md))。この設計上、ブラウザリロードは常に案件一覧へ戻る(URLに画面状態は載らない)。データはlocalStorageに残るため、一覧から再度開けば内容は保持されている
- `CandidateResponse.source`はUI上ChatGPT/Claude/Gemini/Copilot/Perplexity/Otherから選ぶが、保存値は自由文字列(`src/types.ts`の`CANDIDATE_SOURCE_OPTIONS`はUI選択肢の定数であり、データ型としてenum化してはいない)
- Decisionは1案件につき常に最大1件(上書き型・履歴を持たない)。`saveDecision`は保存と更新の両方を兼ねる下位のアップサート関数で、その上に検証付きの`createDecision`(新規作成、重複は拒否)・`updateDecision`(既存の更新のみ)・`deleteDecision`をDay4で追加した
- Day4から、採用済み(決定済み)のcandidateは削除できない(`deleteCandidate`が例外をthrow)。削除したい場合は先に「決定をやり直す」でDecisionを削除する必要がある
- 禁止機能: AI API連携・ログイン連携・Chrome拡張・チーム共有・通知・クラウド同期・課金・自動比較/要約/推薦など([docs/issue-001_mvp_spec.md](./docs/issue-001_mvp_spec.md) 6節)
- データはlocalStorageのみ。バックエンド・APIサーバー・認証・DBは追加しない方針
- 7日後の成功条件・Kill Criteriaは自動計測せず、初期10人への直接ヒアリングで判定する([docs/issue-001_validation_plan.md](./docs/issue-001_validation_plan.md))
- `createProject`はDay2からタイトル必須(空文字・空白のみは例外をthrow)。UIのフォームも合わせてボタンを無効化している(二重の防御)

## 既知の制約(Day5時点)

- ドラッグによる候補の並べ替えは未実装(`order`は追加順のまま固定)
- 一覧からのタイトル・context編集導線はまだない
- localStorageのQuotaExceededError時のエラー表示は未対応。Day5のdogfooding(実案件3件相当)では発生せず、対応を意図的に見送った(Do Not Fix yet、[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md) DNF-1)
- 極端に長いテキスト貼り付け(約16,000文字で検証済み)は、既存の`max-h-80 overflow-y-auto`で崩れずに表示できることをDay5で確認済み。追加のエラー表示は不要と確定した
- sourceプリセット(`CANDIDATE_SOURCE_OPTIONS`)に「Claude Code」が含まれていない。Day5のdogfooding3案件すべてで「Other」経由の追加入力が発生したShould Fix項目(未対応のまま、[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md) SF-1)
- 決定後に採用candidateのcontent/sourceを編集すると、決定サマリーの表示内容も編集後のものに変わる(スナップショットは保存しない設計。ただし採用済みcandidateの削除自体は拒否されるため、Decisionの参照が壊れることはない)

## 関連プロジェクト

- [IdeaForge/founder-os](../IdeaForge/founder-os/) — Weekly ReviewがISSUE-001を推薦した元プロジェクト。tsconfig等の設定ファイルのみ雛形として参考にした(ロジックはコピーしていない)。Founder OS本体には機能追加しない方針
