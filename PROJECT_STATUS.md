# PROJECT_STATUS: AI比較ノート(compare-note)

最終棚卸し日: 2026-07-15
現在のフェーズ: **Day6(公開準備: ビルド・README・CHANGELOG・告知文・フィードバックフォーム項目・GitHub/Vercel公開準備)完了**

---

## 1. プロジェクトの目的

複数AIの回答を横並びで比較し、採用理由を短時間で記録できるローカルWebアプリ。7日間で公開し、初期10人にヒアリングして仮説(H1行動/H2価値/H3継続)を検証する。詳細は[docs/issue-001_mvp_spec.md](./docs/issue-001_mvp_spec.md)。

---

## 2. これまでに完了した成果物

### Day1: セットアップ + データ層(2026-07-15完了)

- Vite + React + TypeScript + Tailwind CSS + ESLint + Vitestの雛形を作成(`IdeaForge/founder-os`のtsconfig構成を参考に流用、ビジネスロジックはゼロから作成)
- `src/types.ts`: `Project` / `CandidateResponse` / `Decision` / `AppData`を[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)通りに定義
- `src/lib/storage.ts`: localStorage(キー`compare-note:v1`)へのCRUD一式を実装。読み込み失敗・不正JSON時は初期状態へ防御的にフォールバック
- `src/screens/ProjectsScreen.tsx` / `src/screens/ProjectDetailScreen.tsx` + `src/App.tsx`: 案件一覧・案件詳細の最小UIとstateベースの画面切り替え(ルーティングライブラリなし)
- `src/lib/storage.test.ts`: 13件のユニットテスト(全件パス)
- Playwrightで実ブラウザ動作を確認: 空状態表示 → 案件作成 → 一覧反映 → リロード後も残る → 詳細画面へ遷移、の一連。コンソールエラーなし

### Day2: 画面1(案件一覧の本実装)(2026-07-15完了)

- `src/lib/storage.ts`: `createProject`にタイトル必須バリデーション(空文字・空白のみは`Error`をthrow)とtitle/contextのtrimを追加。案件一覧用に候補件数(`candidateCount`)と決定状態(`isDecided`)を1回のlocalStorage読み込みで算出する`listProjectsWithSummary`を新設
- `src/types.ts`: `Project`を拡張した`ProjectSummary`型を追加
- `src/screens/ProjectsScreen.tsx`: 固定タイトル「無題の案件」での即時作成処理を削除し、インライン新規作成フォーム(タイトル必須/context任意、Enterで作成、Escapeまたはキャンセルで閉じる、二重送信防止、作成後は詳細画面へ遷移)を実装。案件カードにタイトル・context先頭・更新日時・回答件数・決定状態バッジ(未決定/決定済み)を表示。各カードに削除ボタン(`window.confirm`による確認)を追加。空状態の文言を「まだ案件がありません」+「複数AIの回答を比較して、採用理由を残せます」+ CTAに整理
- `src/lib/storage.test.ts`: Day2要件のユニットテストを8件追加(空タイトル不可・trim・`listProjectsWithSummary`の降順/決定状態/候補件数・Project削除時のカスケード削除と他案件への非影響・CandidateResponse操作時のupdatedAt更新・Decision保存時のupdatedAt更新)
- `src/screens/ProjectsScreen.test.tsx`(新規): `@testing-library/react` + `@testing-library/user-event`を導入し、画面テスト8件を追加(空状態表示・空タイトルで作成ボタン無効化・作成して詳細へ遷移・Escapeで閉じる・カード表示内容・削除確認OK/キャンセル・降順表示)
- Playwrightで実ブラウザ動作を確認(devサーバー起動 → 空状態 → フォームを開く → 空タイトルで作成不可 → タイトル/context入力(前後空白付き)で作成 → 詳細画面へ遷移 → 一覧へ戻る → 2件目作成 → 更新日降順で先頭に表示 → 未決定バッジ・回答0件表示 → Escapeでフォームを閉じる → リロード後もデータが残る → 削除確認OKで削除 → 削除確認キャンセルで残存、の一連。加えてlocalStorageへ直接Decisionを含むデータを投入し「決定済み」バッジと回答2件表示も確認)。コンソールエラーなし

### Day3: 画面2 状態A(候補追加・比較表示)(2026-07-15完了)

- `src/lib/storage.ts`: `addCandidate`にsource/content必須バリデーション(空文字・空白のみは`Error`をthrow)とtrimを追加。`updateCandidate`/`deleteCandidate`は既存のまま利用(他候補への非影響・Project.updatedAt更新は元々実装済みだったことをDay3のテストで再確認)
- `src/types.ts`: `CANDIDATE_SOURCE_OPTIONS`(`ChatGPT`/`Claude`/`Gemini`/`Copilot`/`Perplexity`/`Other`)と`CandidateSourceOption`型を追加。`source`フィールド自体は引き続き自由文字列で保存し、enumで固定しない設計は維持
- `src/screens/ProjectDetailScreen.tsx`(全面実装、Day1のプレースホルダーから置き換え):
  - ヘッダー: 案件タイトル・context・一覧へ戻るリンク・回答件数(`回答 N件`)・決定状態バッジ(`getDecision`で判定、Day3では常に未決定想定だが値としては汎用対応)。存在しない案件IDの場合は「案件が見つかりません」+一覧へ戻るボタンのみを表示し、クラッシュしない
  - 候補回答追加フォーム: source(セレクト: ChatGPT/Claude/Gemini/Copilot/Perplexity/Other)+ Other選択時のみ自由入力欄を表示、content(テキストエリア)。source未選択・content空/空白のみ・送信中は送信ボタンをdisabled化(二重送信防止)。追加後はフォームをリセットし、`addCandidate`の例外はフォーム内にエラーメッセージとして表示
  - 比較表示: 候補0件は空状態、1件は単列、2件はデスクトップで2カラムグリッド、3件以上はデスクトップで横スクロール(各カード`md:w-80`固定幅)。モバイル(`md`未満)は常に1カラムで横スクロールを強制しない。カード内はsourceを上部表示、contentは`whitespace-pre-wrap`で改行保持、`max-h-80 overflow-y-auto`で縦スクロール可能にし長文でも崩れない
  - 各カードに編集・削除ボタン。編集はsource/content両方編集可能(空contentは保存ボタンをdisabled化)、保存・キャンセルどちらも他候補に影響しない。削除は`window.confirm`で確認後に反映。編集・削除ともに`Project.updatedAt`は既存の`updateCandidate`/`deleteCandidate`実装により自動更新される
  - 並び順は既存の`order`(追加順)をそのまま使用。ドラッグ並べ替えは実装していない
- `src/lib/storage.test.ts`: Day3のユニットテストを6件追加(content空文字/source未指定で追加不可、trim確認、order順取得、更新時・削除時に他候補へ影響しないこと)。ファイル全体で26件
- `src/screens/ProjectDetailScreen.test.tsx`(新規): 画面テスト12件を追加(タイトル/context/未決定バッジ表示、空状態、追加(通常source・Other)、空contentで追加不可、複数回答表示、長文・改行のスタイル確認、編集(保存・キャンセル)、削除(確認OK・キャンセル)、存在しない案件IDでの安全な表示と一覧への導線)
- Playwrightで実ブラウザ動作を確認(devサーバー起動 → 案件作成 → ChatGPT回答追加 → Claude回答追加 → 2件比較表示 → 長文・改行でカードが横に崩れないことをDOM幅で確認 → 回答編集 → リロード(SPAのため一覧に戻る仕様を確認した上で再度詳細を開き)編集内容が残ることを確認 → 回答削除 → 一覧へ戻り回答件数が反映されることを確認 → モバイル幅(375px)で1列表示・横スクロールが発生しないことを確認)。加えて候補3件時にデスクトップで横スクロールコンテナが機能すること(`overflow-x: auto`かつ`scrollWidth > clientWidth`)を別途確認。コンソールエラーなし

### 実装したCRUD(`src/lib/storage.ts`)

全データ読み込み(`loadData`) / 初期データ生成(`createInitialData`) / Project作成・一覧・一覧+サマリー・単体取得・更新・削除(`createProject` / `listProjects` / `listProjectsWithSummary` / `getProject` / `updateProject` / `deleteProject`) / CandidateResponse追加・一覧・更新・削除(`addCandidate` / `listCandidates` / `updateCandidate` / `deleteCandidate`) / Decision取得・作成・更新・削除(`getDecision` / `createDecision` / `updateDecision` / `deleteDecision`、下位のアップサート関数として`saveDecision`を維持) / 全データ削除(`clearAllData`) / JSONエクスポート・インポート(`exportData` / `importData`)

補足: `deleteProject`は所属するcandidates/decisionも連鎖削除する。`createProject`はDay2でタイトル必須バリデーションを追加(空文字・空白のみは例外をthrow)。`addCandidate`はDay3で同様のバリデーション(source/content必須・trim)を追加。

### Day4: 決定記録機能 + 状態Bへの切り替え(2026-07-15完了)

- `src/lib/storage.ts`: 既存の`getDecision`/`saveDecision`(Day1で先行実装済みだったバリデーションなしのアップサート関数)はそのまま維持し、その上に検証付きの`createDecision`(新規作成専用。案件・候補の存在チェック、候補が対象案件に属するかのチェック、reason必須・trim、decisionSummary任意・trim、同一案件への重複作成を拒否)、`updateDecision`(既存決定の更新専用。決定が存在しない場合は拒否、それ以外のバリデーションはcreateDecisionと共通)、`deleteDecision`(決定の削除、案件・候補は残す)を追加。バリデーション本体は`validateDecisionInput`に共通化
  - `deleteCandidate`を変更: 採用中(決定済み)の候補の削除を例外throwで拒否するようにした(従来は決定を道連れに破棄していたが、保守性を優先し「採用済みCandidateは削除不可」に仕様変更。既存テスト1件をこの新仕様に合わせて更新)
- `src/screens/ProjectDetailScreen.tsx`: 状態B(決定済み)を実装
  - 候補カードにラジオボタン(「この回答を採用」)を追加。候補が1件でも採用選択可能、0件のときは決定関連UIを一切表示しない
  - 決定フォーム(reason必須のtextarea・decisionSummary任意のtextarea・「決定を保存」ボタン)。候補未選択/reason空白のみ/保存中はボタンをdisabled化。保存失敗時はフォーム内にエラー表示、成功時はaria-live領域で結果を通知
  - 決定済み時は画面最上部に決定サマリーカード(採用元source・content冒頭・reason・decisionSummary(あれば)・決定日時)を表示。「編集する」で採用candidate・reason・decisionSummaryを再編集(`updateDecision`)、「決定をやり直す」で`window.confirm`後に`deleteDecision`して状態Aへ戻す
  - 比較した他の候補は決定後も引き続き全件表示(完全非表示にしない)。採用済みの候補カードは枠線・「採用済み」バッジで強調し、削除ボタンをdisabled化(title属性で理由を表示)
- `src/screens/ProjectsScreen.tsx`: 変更なし(`isDecided`による「決定済み」/「未決定」バッジ表示はDay2で先行実装済みのため、Day4のDecision保存結果もそのまま反映される)
- テスト: `storage.test.ts`に17件追加(create/update/deleteDecisionの正常系・バリデーション・重複拒否・既存データ互換・採用済みCandidate削除拒否など)、`ProjectDetailScreen.test.tsx`に16件追加、`ProjectsScreen.test.tsx`に1件追加。既存の46件は1件(採用中候補削除の挙動)を新仕様に合わせて更新した上で全て維持し、合計78件が全通過
- Playwrightで実ブラウザ動作を確認(devサーバー起動 → 案件作成 → 候補2件追加 → 1件を選択 → reason/decisionSummary入力 → 決定保存 → 決定済み表示 → リロード相当(SPA仕様により一覧へ) → 一覧で決定済みバッジ確認 → 詳細再オープンで採用candidate・reason・decisionSummaryの保持確認 → 決定をやり直す → 未決定状態に戻り両候補が残ることを確認 → モバイル幅375pxで表示確認、の一連。コンソールエラーなし)

### Day5: 実案件3件でのdogfooding + 改善点抽出(2026-07-15完了)

- 新機能は追加せず、実際に進行中の案件3件(白子町総合計画・香取市KPI診断・IdeaForge Phase6着手判断)でComparisonToDecisionフロー(案件作成→context入力→候補2件登録→横並び比較→採用選択→採用理由記録→decisionSummary記録→一覧へ戻る)を実施
- Playwright(永続ブラウザプロファイル)で実ブラウザ操作を実行し、3案件とも決定記録まで完了。ブラウザプロセスを一度終了させ、`storage.ts`のエッジケース調査等の別作業を挟んだ後に同一プロファイル(同一localStorage)で再訪し、3案件とも決定カード(採用元・理由・decisionSummary・決定日時)が画面最上部に即座に表示されることを確認(H2価値仮説を支持)
- 追加で、7day_plan Day5節に記載されていた懸念事項「極端に長いテキスト貼り付け時のエラー表示」を実際に約16,000文字のテキストで検証した結果、既存の`max-h-80 overflow-y-auto`実装により**エラー・レイアウト崩れとも発生しないことを確認**。追加のエラー表示実装は不要と判明(対応不要という形で当該懸念はクローズ)
- localStorage容量超過(QuotaExceededError)は今回の利用規模(実案件3件+検証用データ)では発生せず、対応は見送り(Do Not Fix yetとしてバックログに記録)
- 発見した改善候補は2件(いずれもShould Fix、Must Fixなし): sourceプリセットに「Claude Code」がなく毎回Other経由の追加入力が必要(SF-1)、「回答を追加」フォームが比較セクションより常に上に固定表示されスクロールが必要(SF-2)。詳細は[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md)
- Kill Criteria仮判定: 4項目中0項目が該当(貼り付けの面倒さ・採用理由記入の価値・再訪時の有用性・既存メモとの比較のいずれもCompare Note側が優位)。ピボット検討は不要と判断
- Must Fixが0件のため、**コード変更は行わなかった**(`git status`で`src/`配下の差分なしを確認済み、既存78件のユニットテストもDay4時点から変更なし)
- 成果物: [docs/day5_dogfooding_report.md](./docs/day5_dogfooding_report.md)(実案件ごとの記録・数値評価・Kill Criteria仮判定)、[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md)(改善候補のMust/Should/Do Not Fix分類)

### Day6: 公開・初回ユーザー検証(2026-07-15完了)

- Must Fix以外の機能追加は行わず(ルール通り)、`src/screens/ProjectsScreen.tsx`のトップページに3行のみのサービス説明(何をするアプリか・誰向けか・何を解決するか)を追加。それ以外の画面・ロジックは変更なし
- 公開前チェック: `npm run lint`・`npm run test`(78件)・`npm run build`をゼロエラーで確認。加えてPlaywrightで「案件作成→回答追加(2件)→決定保存→一覧へ戻る→再訪」の一連を、ローカルpreviewと本番Vercel URLの両方に対して実行し、全項目パス・コンソールエラーなしを確認
- README.mdを刷新: 概要・スクリーンショット2枚(架空のデモデータで撮影。実際の業務案件名を含む初回スクリーンショットは公開前に破棄し撮り直し済み)・使い方・技術構成・今後の予定を追加
- [CHANGELOG.md](./CHANGELOG.md)にv0.1.0のリリースノートを作成
- [docs/day6_feedback_questions.md](./docs/day6_feedback_questions.md): Google Form相当のフィードバック質問項目(最大6問)を作成
- [docs/day6_announcement_drafts.md](./docs/day6_announcement_drafts.md): X投稿(日本語・約140文字)、note記事冒頭(日本語・約430文字)、Product Hunt紹介文(英語)、Reddit投稿文(英語)の告知文ドラフトを作成
- Git: `v0.1.0`のアノテートタグを作成
- GitHub: `tohsugi1991-ctrl/compare-note`をpublicリポジトリとして新規作成し、`main`ブランチと`v0.1.0`タグをpush済み(https://github.com/tohsugi1991-ctrl/compare-note)
- Vercel: 環境変数不要の静的サイトとして本番デプロイ完了。本番URL: **https://compare-note.vercel.app**(Vercel側のGitHub連携は権限不足で自動リンクに失敗したが、CLIからのデプロイ自体は成功。次回以降は`vercel --prod`で再デプロイするか、Vercel管理画面からGitHub連携を設定する)

---

## 3. まだ未着手の項目(Day7以降)

- [ ] 公開・初期10人への案内(Day7)。告知文は[docs/day6_announcement_drafts.md](./docs/day6_announcement_drafts.md)、フィードバック項目は[docs/day6_feedback_questions.md](./docs/day6_feedback_questions.md)を使う
- [ ] Vercel管理画面からGitHubリポジトリとの連携を設定する(以後のコミットで自動デプロイさせたい場合)
- [ ] 余力があればSF-1(sourceプリセットに「Claude Code」追加)・SF-2(回答追加フォームの位置)に着手

---

## 4. 既知の制約

- ドラッグによる候補の並べ替えは未実装(仕様通り、`order`は追加順のまま固定)
- SPAのため画面遷移はURLに反映されない。ブラウザリロードすると常に案件一覧画面に戻る(案件詳細への直接リンク・ディープリンクは未対応)。データ自体はlocalStorageに保存されているため、一覧から再度開けば内容は保持されている
- 案件一覧の並び順は`updatedAt`降順固定。並べ替えUI・検索・フィルタ・タグ・フォルダは仕様通り持たない
- localStorageの制約(端末・ブラウザをまたがない、キャッシュ削除で消える、容量上限、QuotaExceededError時のエラー表示なし)は[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)の記載通り引き続き未対応。Day5のdogfooding(実案件3件相当のデータ量)では発生しなかったため、Do Not Fix yetとして意図的に見送り(詳細は[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md) DNF-1)
- 極端に長いテキスト貼り付け(約16,000文字で検証)は、既存の`max-h-80 overflow-y-auto`実装で崩れずに表示できることをDay5で確認済み。追加のエラー表示は不要と判断し対応しないことを確定した([docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md) DNF-2)
- sourceプリセット(`CANDIDATE_SOURCE_OPTIONS`)に「Claude Code」が含まれていない。Day5のdogfooding3案件すべてで「Other」経由の追加入力が発生したShould Fix項目(詳細は[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md) SF-1)。Must Fixではないため未対応のまま
- 画面テスト(`ProjectsScreen.test.tsx`/`ProjectDetailScreen.test.tsx`)は`@testing-library/react`のみ導入し、`@testing-library/jest-dom`は未導入(標準アサーションで代替し、依存を最小限に留めた)
- Decisionは`decidedAt`1つのみを持ち、初回決定日時と更新日時を区別しない(編集のたびに上書き)。既存の[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)の設計判断をDay4でもそのまま踏襲した
- 決定後に採用したcandidateのcontent/sourceを編集すると、決定サマリーにも編集後の内容がそのまま反映される(スナップショットを保存しない設計のため)。ただし採用済みcandidate自体の削除はDay4から不可になったため、決定の参照(`selectedResponseId`)が壊れることはない

---

## 5. 次にやるべきこと(1件)

> **Day7「公開・初期ユーザーへの案内」に着手する**: 本番URL(https://compare-note.vercel.app )が確定したので、[docs/day6_announcement_drafts.md](./docs/day6_announcement_drafts.md)の`[URL]`をこのURLに置き換えてからX/noteへ投稿し、知人・個人開発者コミュニティ・Claude Code利用者コミュニティへ直接案内する。フィードバック回収先として[docs/day6_feedback_questions.md](./docs/day6_feedback_questions.md)の質問項目をGoogle Formとして実際に作成し、そのリンクを案内文に含める。詳細は[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md) Day7節。

---

## 6. 依存関係

```
docs/issue-001_mvp_spec.md ────────┐
docs/issue-001_user_flow.md ───────┼─→ src/types.ts ─→ src/lib/storage.ts ─→ src/screens/*.tsx ─→ src/App.tsx
docs/issue-001_data_schema.md ─────┘
```
