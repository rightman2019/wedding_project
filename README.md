# Wedding Site Template (GitHub → Cloudflare Pages)

このテンプレは「ビルドなしの静的サイト」です。`public/` がそのまま公開されます。

## 1. 編集ポイント（最短）
- `public/config.js` を編集（新郎新婦名、日付、会場、地図URL、出欠フォームURL など）
- 文章やページ構成を変えたい場合は各 `index.html` を直接編集

## 2. ローカル確認（任意）
エクスプローラで `public/index.html` を開いてもOKです。
より正確に見るなら簡易サーバ：

```bash
# 例: Python が入っている場合
cd public
python -m http.server 8080
# http://localhost:8080
```

## 3. Cloudflare Pages でデプロイ（Git連携）
Cloudflare Pages で GitHub リポジトリを連携し、以下の設定で作成します。

- Build command: （空欄）
- Build output directory: `public`
- Root directory: （空欄）

push すると自動で反映されます。PR を作るとプレビューURLも出ます。

## 4. 招待制（推奨）
- まずは `noindex`（全ページに設定済み）＋ `robots.txt` で検索に出にくくしています。
- さらに厳密にするなら Cloudflare Access でメールOTP保護が可能です。
