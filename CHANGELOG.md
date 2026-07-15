# Changelog

このプロジェクトの変更履歴を記録します。

## [0.1.0] - 2026-07-15

初回リリース。7日間計画のDay1〜6で実装した内容をまとめて公開。

### 追加

- 案件一覧画面: 新規案件作成(タイトル必須・context任意)、更新日時・回答件数・決定状態バッジ付きの一覧表示(updatedAt降順)、削除(確認あり)
- 案件詳細画面(未決定状態): AIの回答追加フォーム(source: ChatGPT/Claude/Gemini/Copilot/Perplexity/Other + content貼り付け)、複数回答のレスポンシブな横並び比較表示、回答の編集・削除
- 案件詳細画面(決定済み状態): 採用する回答の選択、採用理由(必須)・決定内容の要約(任意)の記録、決定サマリーカード表示、決定の編集・やり直し
- トップページにサービス説明(3行: 何をするアプリか・誰向けか・何を解決するか)を追加
- データ保存はlocalStorageのみ(バックエンド・APIサーバー・認証なし)
- ユニットテスト78件(vitest)、ESLint設定

### 既知の制約

- ドラッグによる候補の並べ替えは未実装
- ブラウザリロードすると案件一覧画面に戻る(URLへの画面状態の反映なし。データ自体はlocalStorageに保持される)
- localStorage容量超過(QuotaExceededError)時のエラー表示は未対応
- sourceプリセットに「Claude Code」が含まれていない
- エクスポート・バックアップ機能なし

詳細は[docs/day5_improvement_backlog.md](./docs/day5_improvement_backlog.md)を参照。
