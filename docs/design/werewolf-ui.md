# 人狼画面の視覚基準

基準: werewolf-reference.png。既存の紙と木の卓上、茶色の細い枠、緑のCTAを維持する。

- Keep: 公開数字の縦一覧、緑の大きな60秒表示、本人への受け渡しと候補選択の分離。
- Adapt: 既存CardSurface/PrimaryButtonを再利用。4〜8人では自然な縦スクロール。画面を固定高さにしない。
- Reject: 画像の端末フレーム、装飾的な人物アイコン、同時に受け渡しと秘密投票を表示する構図。
- Components: WerewolfScreen、PrivateBallot、既存Setup/Sort/SecretCardsのモード対応。
- Assets: 基準画像は設計資料のみ。既存CSSの紙/木を使い、すべての文字・数字はHTML。
- Checks: 320/390/430pxのoverflow、44px操作領域、WebKit/Chromiumの秘密表示解除と完走。
