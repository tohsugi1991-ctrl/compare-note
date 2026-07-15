# PROJECT_STATUS: AI比較ノート(compare-note)

最終棚卸し日: 2026-07-15
現在のフェーズ: **Day4(画面2 状態B: 決定記録・意思決定保存)完了**

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

---

## 3. まだ未着手の項目(Day5以降)

- [ ] dogfooding(白子町次期総合計画・香取市案件での実利用)・バグ修正(Day5)
- [ ] Vercelデプロイ・告知文準備(Day6)
- [ ] 公開・初期10人への案内(Day7)

---

## 4. 既知の制約

- ドラッグによる候補の並べ替えは未実装(仕様通り、`order`は追加順のまま固定)
- SPAのため画面遷移はURLに反映されない。ブラウザリロードすると常に案件一覧画面に戻る(案件詳細への直接リンク・ディープリンクは未対応)。データ自体はlocalStorageに保存されているため、一覧から再度開けば内容は保持されている
- 案件一覧の並び順は`updatedAt`降順固定。並べ替えUI・検索・フィルタ・タグ・フォルダは仕様通り持たない
- localStorageの制約(端末・ブラウザをまたがない、キャッシュ削除で消える、容量上限、QuotaExceededError時のエラー表示なし)は[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)の記載通りDay4時点でも未対応。エラー表示はDay5で追加予定
- 画面テスト(`ProjectsScreen.test.tsx`/`ProjectDetailScreen.test.tsx`)は`@testing-library/react`のみ導入し、`@testing-library/jest-dom`は未導入(標準アサーションで代替し、依存を最小限に留めた)
- Decisionは`decidedAt`1つのみを持ち、初回決定日時と更新日時を区別しない(編集のたびに上書き)。既存の[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)の設計判断をDay4でもそのまま踏襲した
- 決定後に採用したcandidateのcontent/sourceを編集すると、決定サマリーにも編集後の内容がそのまま反映される(スナップショットを保存しない設計のため)。ただし採用済みcandidate自体の削除はDay4から不可になったため、決定の参照(`selectedResponseId`)が壊れることはない

---

## 5. 次にやるべきこと(1件)

> **Day5「通し動作確認 + 自分自身での実案件投入(dogfooding)」に着手する**: 白子町次期総合計画・香取市案件など、実際に進行中の案件のうち最低2件で実際にComparisonToDecisionフロー(案件作成→候補貼り付け→比較→決定)を使う。UIの分かりにくい箇所・レスポンシブ崩れを修正し、localStorage容量超過時や極端に長いテキスト貼り付け時の最低限のエラー表示を追加する。詳細は[docs/issue-001_7day_plan.md](./docs/issue-001_7day_plan.md) Day5節。

---

## 6. 依存関係

```
docs/issue-001_mvp_spec.md ────────┐
docs/issue-001_user_flow.md ───────┼─→ src/types.ts ─→ src/lib/storage.ts ─→ src/screens/*.tsx ─→ src/App.tsx
docs/issue-001_data_schema.md ─────┘
```
