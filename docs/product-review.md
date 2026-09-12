# 価値観カードの見直し

## 製品の本質と調査範囲

対面の2〜8人がスマホ1台を回し、本人だけが見た数字をお題への例えで伝える協力ゲーム。
数字そのものを言わずに相談する体験、2〜3人への2枚配布、4〜8人への1枚配布、
降順の固定順位に対する答え合わせ、お題管理、同じメンバーでの再戦を維持する。

基準は `e0b8e3cc5620a12bbda8d88af1d34c1aaeea4b72`。
README、9画面、共通部品、domain/state/storage、90件のお題、PWA、依存lock、CI、既存テストを確認した。
APIやバックエンドはなく、名前とお題設定のみ端末内のlocalStorageを使う。

## 観測と変更理由

| 領域 | 旧版で確認した問題 | 改善方針 |
|---|---|---|
| ルール | 遊び方・READMEは昇順、画面・実際の採点は降順 | 降順の固定順位を全経路で説明する |
| 秘密カード | ポインタ専用、アプリ切替時に隠れない | 中断・キー解放・フォーカス喪失で非表示にする共通制御 |
| ダイアログ | Escape非対応、表示後も背景にフォーカスが残る | ネイティブdialogで背景操作を止め、閉じたら元の操作へ戻す |
| 進行 | ホームで即座に離脱、答え合わせ中もお題変更可能 | 終了確認と、開封後の変更禁止をUIとreducerの両方に反映 |
| 並べ替え | 行全体のtouch-noneでスクロールと競合 | ハンドルでドラッグ、本文でスクロール、上下操作を併用 |
| お題 | 抽選対象0件でも開始でき、汎用エラーだけになる | 件数と復旧導線を表示し、0件で開始させない |
| 保存データ | 人数復元の上限なし、自作お題の空白・ID重複を受け入れる | 既存の正常データを保ち、異常値だけ正規化する |
| 数字配布 | 重複する乱数を引き直すwhileは終了上限がない | 1〜100の有限シャッフルと、人数・範囲・重複検査 |
| 状態 | 終了の重複加算、開封順と状態変更の制約不足 | ラウンドの操作可能性をreducerで保証 |
| PWA | 自動更新設定、ラウンドはメモリだけ | 更新と再読込のタイミングを明示し、プレイ中は保留 |
| 品質管理 | PR用CIなし、依存監査11件 | PR検査と互換範囲の修正更新 |

PWAの旧版buildは単純な `navigator.serviceWorker.register()` を生成している。
`autoUpdate` という設定だけで「実際にページを自動リロードした」とは判定しない。
更新時のworker切替・キャッシュと、ページの再読込は区別して検証する。

## 画面と世界観

世界観辞書: 木の卓上、生成画像から抽出した麻布とクリーム色の紙、茶の細い縁、
深緑の主要ボタン、朱色のミス表示。短い日本語で「見る・渡す・例える・並べる・開く」を案内する。
新しい世界観や画像アセットは導入せず、既存の基準画像とCSSによる素材表現を維持する。

盤面を主役にし、操作はカード行の実寸と通常フローに合わせる。
ドラッグハンドルと上下ボタンは行に固定し、名前は折り返す。
ダイアログは画面端から余白を取り、内容の高さに合わせて広がり、縦方向だけスクロールする。
固定比率のHUDや絶対座標によるカード内配置は追加しない。

## 変更前と回帰検証

変更前はunit 45/45、Lint、型検査を含むbuildが成功。
既存のWebKit 390px E2Eは、複数dev serverの併走で停止し、単一serverで9.2秒で完走した。
以降の検証は同じserverを再利用し、PWAはproduction buildを専用経路で検証する。

修正前に追加した回帰検査で、キーボード表示・visibilitychangeでの非表示、
保存人数上限、不正なお題、配布人数・カード値検査、終了の重複加算が失敗することを確認した。

代表的なモバイル幅の完走、8人・長い名前の収まり、秘密カード操作、
お題0件からの復旧、ダイアログ、production buildのPWA更新を確認した。
実機iPhone/iPadとOSのアプリ一覧サムネイルはブラウザエミュレーションの証拠と区別する。

## 要件台帳と初版からの差分

初版は [Issue #1](https://github.com/santa928/ito/issues/1) のITO-01〜09。
全要件を維持し、保留・削除はない。任意項目の検索・自動スクロール・削除Undoは今回の必須範囲に追加しない。
要件の状態と、実行済み検証の結果は区別する。

| ID | 要件差分 | 実装 | 対応する証拠 |
|---|---|---|---|
| ITO-01 | 維持 | game、HowToPlay/Sort/Open/Result、README | gameの4枚24順列・固定位置採点、E2Eの結果の降順比較 |
| ITO-02 | 維持 | SecretCards、Reveal、RoundControls | Reveal unitのキー・blur・visibility・cancel/capture/pagehide、両ブラウザの押下・領域外・対象変更・再確認 |
| ITO-03 | 維持 | Modal、RoundControls、endRound | 両ブラウザでTab循環・Escape・元focus、確認途中/並べ替え/開封後の終了取消・確定 |
| ITO-04 | 維持 | Sort、cardLabels、長名の折返し | 同名ラベルunit、8人320/390/430pxの境界計測・画像、Chromium CDPタッチスクロール・ハンドル・上下操作 |
| ITO-05 | 維持 | App、Setup、Topics、Topic、reducer | 0件の保存と復旧、カテゴリOFF/個別OFF/無効カテゴリの自作、1件の再抽選無効、storage失敗時のメモリ反映 |
| ITO-06 | 維持 | game、settings、Setup、App | 2〜8人配札、0/100枚・固定/不正乱数、0/1/9/101人保存、壊れた設定、24コードポイント入力・原本保持 |
| ITO-07 | 維持 | appState、App | 段階別reducer回帰・重複完了拒否、両ブラウザ2/3/8人それぞれ2ラウンド |
| ITO-08 | 維持 | pwa、UpdatePrompt、main、Vite設定 | test:pwaによる本物のworkerで旧版→修正版→次版、明示更新・保留・結果保持 |
| ITO-09 | 維持 | PR workflow、Playwright、Compose、README | Docker unit/lint/build/E2E、Linux別volume、PR CI（結果はPRに記録） |
| 依存監査 | 追加 | package/lock | Viteを8.0系の修正バージョンへ限定し、既存依存の修正更新。新しい依存・フレームワークの置換はない |

独立レビューでは、名前のtrim前切詰め、修復した設定の開始時上書き、異なるLinuxでの依存volume共有を指摘。
trim後24文字をゲームと保存で共通化し、修復通知がある場合はお題管理の明示保存まで原本を保持する。
Dockerのweb/e2eは別volumeとlock準拠installを使う。
実ブラウザではnative dialogだけでTabが外へ抜けるケースを検出したため、表示中の操作を循環させる制御も追加した。

## 性能とPWA移行の検証方法

`tests/pwa/verify.mjs` は基準commitをDockerの一時ディレクトリに展開して元のlockでbuildし、
修正版と、一時コピーのタイトルだけを変えた次版を、同一origin/path `/ito/` で順に配信する。
Playwrightの通信interceptや通知stateのモックは使わない。テストのためにproductionへ値取得APIは追加しない。

旧版で8人の相談まで進めてから修正版を配信し、workerがwaitingになっても画面と並びが維持されることを確認。
旧版には更新UIがないため全ゲームタブを閉じる。scope外の観測ページから自然なactivate完了を観測後、開き直して修正版を確認する。
すぐ開き直すと旧workerが引き続き使われるケースも実測した。初回移行を「ホームの更新ボタンで完了」とは扱わない。

修正版では1枚開封後に次版を配信し、実workerのwaitingを確認してから残りを開封する。
ゲームと結果が維持され、homeへ戻っても再読込せず、「あとで」も保留を維持し、「更新する」で初めて次版へ移ることを検証する。
旧版・修正版の8枚の並べ替えで20回ずつ、click受信から次のrequestAnimationFrame callbackまでを計測する。
これは描画callbackまでの値であり、物理ディスプレイの表示遅延やiPhone実機の性能を表さない。
配信量はSWとworkboxを含むdist内の全JS・CSSのgzipを合計し、画像は変更しない。

| 受け入れ条件 | 目標 | 結果の記録先 |
|---|---|---|
| 配札の停止性 | 最大100回の乱数取得 | game.test.tsの固定乱数/100枚回帰 |
| 秘密表示解除 | 中断イベント処理後に非表示、意図的な遅延なし | 共通部品のunitとブラウザ回帰 |
| 20回の操作p95 | Chromium390px・8枚・CPU制限なしで100ms以下 | PWA検証のJSONとPR本文 |
| JS+CSS gzip増分 | 基準比10KiB以内 | PWA検証のJSONとPR本文 |

## 最終のローカル実行結果

実行日は2026-09-12。対象ソースはこの資料を含むPRのhead（具体的なSHAはPR本文に記録）。
主な実行環境は `mcr.microsoft.com/playwright:v1.59.1-noble`、開発環境の別検証は `node:22-alpine`。

| 検証 | コマンド | 結果 |
|---|---|---|
| unit | `docker exec ito-review-preview npm test` | 95件成功 |
| lint | `docker exec ito-review-preview npm run lint` | 成功 |
| 型検査・本番build | `docker exec ito-review-preview npm run build` | 成功 |
| 本番previewのE2E | `docker exec ito-review-preview npm run e2e` | 24件成功、ドラッグ位置のテスト指定1件を修正して再実行成功。合計25件を確認。CDP専用1件はWebKitでは対象外 |
| ドラッグ位置の再検証 | `docker exec ito-review-preview npm run e2e -- --project=chromium-mobile --grep '8人と長い同名'` | 1件成功。中央境界ではなく行の下半分へ挿入する手順を確認 |
| 実worker更新・性能 | `docker exec ito-review-preview npm run test:pwa` | 旧版→修正版→次版が成功。結果は [pwa-report.json](review-evidence/pwa-report.json) |
| 依存監査 | `docker exec ito-review-preview npm audit --audit-level=low` | 検出0件（初回11件）。全リスク不存在の保証とはしない |
| 新規Alpine依存volume | `docker compose -p ito-review-isolated run --rm web sh -c 'npm ci && npm run build'` | install・型検査・build成功。Nobleの依存volumeとは別 |

開発serverでは依存更新後の長いWebKit試験で再読込・タイムアウトが発生した。
サーバ再起動後の8人2ラウンドは約72秒で成功。最終E2Eは本番previewへ切り替え、
HMRの影響を除いた成果物を検証した。開発serverの再読込原因を特定済みとは扱わない。
このため2ラウンド試験には120秒、通常試験には60秒の上限を設けている。

| 性能 | 基準 | 修正版 | 判定 |
|---|---:|---:|---|
| 20操作p95 | 14.0ms | 14.5ms | 100ms以内 |
| 最大値 | 15.5ms | 14.9ms | 20サンプルすべてをJSONに保存 |
| JS+CSS gzip | 80,885 bytes | 87,367 bytes | +6,482 bytes、10KiB以内 |

画像は目視でも確認した。盤面は [320px](review-evidence/sort-320.png) / [390px](review-evidence/sort-390.png) / [430px](review-evidence/sort-430.png)、
ダイアログは [WebKit 390px](review-evidence/card-dialog-webkit.png)。全てテスト用の参加者名で、秘密の数字は表示していない。

実機iPhone/iPad、OSアプリ切替サムネイル、公開URLへの反映は未確認。
今回は公開していないため公開URL smokeは行わず、実機・公開後確認はリリース時の条件とする。
Lighthouseや全viewportの追加matrixは、今回の不具合を検出する検査として選んでいない。

## リスクと対策

| リスク | 対策・証拠の境界 |
|---|---|
| 秘密の表示残り | 共通holdと複数の中断イベント、非表示時は数字DOMを作らない。OSサムネイルや撮影防止は保証しない |
| 遷移制約による進行停止 | reducerで不正actionを確認し、WebKit/Chromiumで通常進行と再戦を確認 |
| 保存データの損失 | loadとゲーム開始で修復原本を保持し、明示保存まで上書きしない。保存失敗後はメモリで続ける |
| 更新による中断 | homeでのみ明示適用、入力/ゲーム/結果画面で保留。初回移行・他タブ・手動再読込の限界を明記 |
| 開発環境による検証の混入 | E2Eは事前buildのpreviewを使用。実行中はdistを更新しない。Docker Linux環境ごとに依存volumeを分離 |

## 非対象と制約

- 目的・採点方式・ブランドの全面変更、オンライン対戦、ログイン、外部API、技術スタックの置換。
- 秘密の数字・ラウンドの永続化。ページ再読込やOSによるプロセス終了からの復帰は保証しない。
- 開発ツールで内部値を読む行為まで防ぐセキュリティ境界。対面でのうっかりした表示を減らす設計とする。
- 本番反映はユーザーの明示許可を得てから行う。
