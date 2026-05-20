# 価値観カード

スマホ1台を対面で回して遊ぶ、価値観のズレを楽しむ協力型カードゲームです。

## 遊び方

1. 人数を選びます。名前は任意です。
2. スマホを順番に回して、自分の数字だけ確認します。
3. お題に対して、数字の大きさを例えで伝えます。数字そのものは言いません。
4. 相談して、カードを小さいと思う順に並べます。
5. 1枚ずつオープンします。順番を間違えるとライフが減ります。
6. 最後に数字とミス箇所をふりかえります。

## 開発

ホスト環境を汚さないため、npm系コマンドはDocker内で実行します。

```bash
docker compose run --rm web npm install
docker compose up web
```

開発サーバ:

```text
http://localhost:5173
```

## 検証

```bash
docker compose run --rm web npm test
docker compose run --rm web npm run build
docker compose run --rm e2e npm run e2e
```

E2EはPlaywright公式イメージの `e2e` サービスで実行します。既に5173番ポートを使っているコンテナがある場合でも、上記の `docker compose run --rm e2e npm run e2e` はコンテナ内でdev serverを起動して検証します。

## 公開

GitHub Pages は `main` ブランチへの push をきっかけに、GitHub Actions で `dist/` を配信します。

公開URL:

```text
https://santa928.github.io/ito/
```

手元で配信用ビルドだけ確認する場合:

```bash
docker compose run --rm web npm run build
```

Vercel に出す場合も、静的Webアプリとして同じ `dist/` を配信できます。
