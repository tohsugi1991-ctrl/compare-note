# AI比較ノート(compare-note)

複数AIの回答を貼り付けて横並び比較し、採用した回答と理由(1〜3行)を記録できるローカルWebアプリ。バックエンドなし、データはブラウザのlocalStorageのみに保存される。

詳細な設計判断は[docs/](./docs/)の仕様書を参照。

- [issue-001_mvp_spec.md](./docs/issue-001_mvp_spec.md) — 何を作るか・何を作らないか
- [issue-001_user_flow.md](./docs/issue-001_user_flow.md) — 画面遷移・状態設計
- [issue-001_data_schema.md](./docs/issue-001_data_schema.md) — データ構造
- [issue-001_7day_plan.md](./docs/issue-001_7day_plan.md) — Day1〜7の実装計画

現在の進捗は[PROJECT_STATUS.md](./PROJECT_STATUS.md)、再開時に読むべきファイルは[resume.md](./resume.md)を参照。

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev      # 開発サーバー起動(http://localhost:5173)
npm run test     # ユニットテスト(vitest)
npm run build    # 型チェック + 本番ビルド
npm run lint     # ESLint
npm run preview  # ビルド後のプレビュー
```

## 技術構成

- React + TypeScript + Vite + Tailwind CSS
- 状態管理: なし(useStateのみ)。ルーティングライブラリは使わず、画面切り替えは`App.tsx`のstateで行う
- データ: localStorage(キー: `compare-note:v1`)。バックエンド・APIサーバー・認証なし
- テスト: Vitest + jsdom + @testing-library/react(画面テスト)

## 現在の実装範囲(Day4まで)

- 画面1(案件一覧): 新規案件作成フォーム(タイトル必須・context任意)、更新日・回答件数・決定状態バッジ付きのカード表示(updatedAt降順)、削除(確認あり)、空状態
- 画面2(案件詳細)状態A(未決定): タイトル・context・回答件数・決定状態バッジ、候補回答の追加フォーム(source選択+content貼り付け)、候補回答のレスポンシブな比較表示(2件はグリッド、3件以上は横スクロール、モバイルは1列)、各回答の編集・削除、各候補への採用選択(ラジオボタン)
- 画面2(案件詳細)状態B(決定済み): 決定の記録(採用candidate・採用理由reason必須・decisionSummary任意)、決定サマリーカード(採用元source・content・reason・decisionSummary・決定日時)、「編集する」(採用candidate・reason・decisionSummaryの再編集)、「決定をやり直す」(確認ダイアログ→決定を削除し状態Aへ戻る)。比較した他の候補は決定後も引き続き表示。採用済みの候補は削除不可(ボタン無効化)

詳細は[PROJECT_STATUS.md](./PROJECT_STATUS.md)、[resume.md](./resume.md)を参照。

## データの保存について

このアプリのデータはブラウザ単位で保存される。同じ人でもPCとスマホ、別のブラウザでは共有されない。キャッシュ削除・シークレットモードでは消える。詳細は[docs/issue-001_data_schema.md](./docs/issue-001_data_schema.md)を参照。
