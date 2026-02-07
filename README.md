# 結婚式公式サイト（Static / Cloudflare Pages）構成メモ

このREADMEは「どこに何があるか」と「修正依頼時に渡すファイル」を最短で分かるようにまとめたものです。  
（基本は `public/` 配下がそのままデプロイ対象です）

---

## 1) 主要ファイル（まずここだけ覚える）

- `public/config.js`  
  **文言・日時・会場・URL・FAQなど“内容”の一元管理**。ここを直すと全ページに反映。

- `public/style.css`  
  **全ページ共通の見た目**（色、余白、カード、ヘッダ、レスポンシブ、メニュー頁の背景色など）。

- `public/script.js`  
  **全ページ共通の挙動**（configの反映、ナビの現在地表示、ハンバーガー、背景（backdrop）、スプラッシュ、メニュー画像ビューア等）。

- `public/index.html`  
  トップページ（スプラッシュ含む／カードの並び・固定文言はここ）。

---

## 2) ルーティング（ページ構成）

各ページは「フォルダ + index.html」でURLが決まります。

- `/` → `public/index.html`（トップ）
- `/schedule/` → `public/schedule/index.html`（当日スケジュール）
- `/access/` → `public/access/index.html`（アクセス）
- `/faq/` → `public/faq/index.html`（FAQ）
- `/menu/` → `public/menu/index.html`（スペシャルメニュー）
- `/rsvp/` → `public/rsvp/index.html`（招待状／外部URL案内）

その他：
- `public/404.html`（Not Found）
- `public/robots.txt`（検索に出さない設定）
  - さらに各HTMLにも `meta name="robots" content="noindex,nofollow"` を入れてます

---

## 3) assets（画像・PDFなど）

- `public/assets/menu/`
  - `SPECIAL_MENU.pdf` … **PDF本体**
  - `SPECIAL_MENU.png` … PDFからの画像化（予備）
  - `special_menu_page_1.png` … **/menuで表示しているメイン画像**
- `public/assets/icons/`
  - ナビやカード見出しで使うSVG/PNG一式
  - `isle-of-islay-distillery-map.png(.webp)` … メニューアイコン
- `public/assets/splash.svg`
  - トップページの**スプラッシュ背景**に全面表示しているSVG

---

## 4) “config.js”の反映ルール（data属性）

HTML内の以下属性は `script.js` が `config.js` から埋め込みます。

- `data-wedding-text="xxx"`  
  `WEDDING_SITE.xxx` をテキストとして反映（例：`venue.name`, `event.open` など）
- `data-wedding-href="xxx"`  
  `WEDDING_SITE.xxx` をリンク（href）として反映
- `data-wedding-couple`  
  `couple.groom & couple.bride` を連結表示
- `data-wedding-schedule-body`  
  `schedule[]` を表に展開（/schedule）
- `data-wedding-faq`  
  `faqs[]` をQ&Aに展開（/faq）
- `data-hide-if-empty="xxx"`  
  値が空なら、そのブロックを非表示（例：giftsカード）

---

## 5) ページ固有のフラグ（body class）

- `no-backdrop`  
  背景の動くやつ（backdrop/shapes）を**出さない**（例：`/menu`）
- `menu-page`  
  メニューページの配色・ナビ配色などを**専用ルールに切替**
- `nav-collapsed / nav-open`  
  `script.js` が付け外し（ハンバーガー表示・開閉制御）

---

## 6) “固定文言”の置き場所（config以外）

原則は `config.js` ですが、以下はHTML直書きです（必要ならここを編集）。

- トップ：`public/index.html`
  - スプラッシュ文言（`Ukyo & Seina / Official Site` など）
  - 「メニュー」カードの説明文（新郎が特別に… 等）
- メニュー：`public/menu/index.html`
  - メニュー頁上部の説明文
  - 「PDFを開く / ダウンロード」ボタン

---

## 7) ChatGPTに修正依頼するとき：添付してほしいファイル早見表

### A. 文言だけ直したい（名前/日時/会場/FAQ/連絡先 等）
- ✅ `public/config.js`

### B. レイアウト/色/余白/フォント/カード/ヘッダなど“見た目”
- ✅ `public/style.css`
- （問題のページ）`public/<page>/index.html` もあると早い

### C. ナビ（ハンバーガー化、現在地、開閉）、スプラッシュ、背景の挙動など“動き”
- ✅ `public/script.js`
- （問題のページ）`public/<page>/index.html`

### D. メニューPDF/画像表示（背景色合わせ、画像差し替え、PDFリンク等）
- ✅ `public/menu/index.html`
- ✅ `public/style.css`
- ✅ `public/assets/menu/*`（PDF/PNG）

### E. “このページだけ背景を止めたい/止めたくない”
- ✅ 対象ページの `public/<page>/index.html`（`body` class確認）
- ✅ `public/script.js`（注入の有無）
- ✅ `public/style.css`（見た目）

---

## 8) 依頼テンプレ（そのまま貼ってOK）

### 修正依頼テンプレ
- 対象URL：
- 端末：PC / スマホ（機種・ブラウザ）
- 期待する見た目/挙動：
- 現状の問題（スクショ歓迎）：
- 添付ファイル：
  - `public/config.js`（必要なら）
  - `public/style.css`（必要なら）
  - `public/script.js`（必要なら）
  - `public/<page>/index.html`（対象ページ）
  - 画像/PDF（必要なら）

※ ChatGPT側から「次はこのファイルください」と言われたら、そのファイルだけ追加で投げればOKです。

---
