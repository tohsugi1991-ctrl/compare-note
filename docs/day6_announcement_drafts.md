# Day6 告知文ドラフト

Day7の初期ユーザー案内で使う告知文の下書き。[issue-001_launch_plan.md](./issue-001_launch_plan.md)の訴求文をベースに、媒体別に調整した。`[URL]`は本番URL確定後に置き換える。

---

## 1. X投稿(日本語・140文字程度)

本文142文字(URL別)。

```
ChatGPT・Claude・Geminiを行き来して仕事してませんか。複数AIの回答を横に並べて比較し、採用理由を1〜3行で記録できるツールを作りました。データは自分のブラウザにしか保存されないシンプル設計。「どっちを採用したっけ」を減らせるか試しています。感想を聞かせてください。

[URL]
```

---

## 2. note記事冒頭(日本語・300〜500文字)

434文字。この後に「なぜ作ったか(JTBD)」「7日間の作り方」「使い方」「フィードバックのお願い」と続ける想定。

```
ChatGPT、Claude、Gemini。気づけば複数のAIを毎日行き来しながら仕事をしています。地方自治体向けの提案書を作るときも、同じ問いを2つ以上のAIに投げて回答を見比べることがよくあります。

ただ、この「比較」が意外とやっかいでした。ブラウザのタブを何個も切り替えながら読み比べ、結局どれを採用したか、なぜそれを選んだかは記憶と勘に頼りきり。数日後に案件を再開すると「あれ、どの回答を使ったんだっけ」と自分の判断根拠を思い出せないことが何度もありました。

そこで、複数AIの回答を横に並べて比較し、採用した回答と理由を1〜3行だけ記録できるシンプルなツール「AI比較ノート」を7日間で作りました。ログイン不要、データは自分のブラウザにしか保存されないローカル完結の設計です。

実際に自分が抱えている案件3件で使ってみて、決定記録が残っていることの安心感を実感しました。まだ生まれたばかりの小さなツールですが、よければ触ってみて感想を聞かせてもらえると嬉しいです。
```

---

## 3. Product Hunt用紹介文(英語)

**Tagline**

```
Compare AI answers side by side, and remember why you picked one.
```

**Description**

```
Compare Note is a tiny local-first web app for people who bounce between ChatGPT, Claude, and Gemini on the same task.

Paste answers from multiple AIs side by side, pick the one you went with, and jot down a 1-3 line reason. Next time you reopen the project, you'll instantly remember what you chose and why — no more "wait, which answer did I actually use?"

No login, no backend, no tracking. Everything is stored in your browser's localStorage only. Built solo in 7 days and dogfooded on 3 real consulting projects before launch.

Free to use. Would love your feedback, especially on whether the "record your reason" step actually sticks as a habit.
```

---

## 4. Reddit投稿文(英語)

想定投稿先: r/SideProject、r/InternetIsBeautiful、r/ChatGPT のいずれか(コミュニティルールを確認の上で選択)。

**Title**

```
I kept forgetting which AI answer I actually used, so I built a tiny comparison tool (7-day solo build)
```

**Body**

```
I use ChatGPT, Claude, and Gemini for the same tasks pretty often (mostly consulting/proposal writing), and I kept running into the same problem: I'd compare a few AI answers, pick one, and then a few days later have no idea which one I'd used or why.

So I built Compare Note over 7 days: paste 2+ AI answers into a project, view them side by side, mark which one you adopted, and write a 1-3 line reason. That's it. When you come back to the project later, the decision is right there at the top.

A few deliberate constraints:
- No login, no backend, no AI API calls — it's just a static site with localStorage
- No auto-summarization or "AI picks the best answer" — you still read and decide
- Free, no ads

I dogfooded it on 3 real projects before posting this, and it held up. Still very early (v0.1.0), so I'd genuinely appreciate feedback — especially "would you actually use this" and "what's missing."

[URL]
```

---

## 使用時の注意

- `[URL]`は本番デプロイ後のVercel URLに置き換える
- 知人への個別案内は[issue-001_launch_plan.md](./issue-001_launch_plan.md)の訴求文(個別DM用)を使う。上記4本はX/note/Product Hunt/Redditの公開投稿用
- Reddit・Product Huntへの実際の投稿は、各コミュニティ・プラットフォームのルール確認後にユーザー本人が行う
