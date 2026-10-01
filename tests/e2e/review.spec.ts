import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { builtInTopics } from '../../src/domain/topics'

/** 秘密の数字をログへ出さず、指定人数の配布画面へ進む。 */
async function startGame(page: Page, count = 2, names: string[] = []) {
  await page.goto('/')
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByLabel('人数').selectOption(String(count))
  for (let index = 0; index < names.length; index += 1) await page.getByLabel(`プレイヤー${index + 1}`, { exact: true }).fill(names[index])
  await page.getByRole('button', { name: '開始', exact: true }).click()
}

/** 人数分の確認を終えて、相談中の並べ替え画面まで進む。 */
async function goToSort(page: Page, count = 2, names: string[] = []) {
  await startGame(page, count, names)
  for (let i = 1; i < count; i += 1) await page.getByRole('button', { name: '見終わった' }).click()
  await page.getByRole('button', { name: '相談へ進む' }).click()
  await page.getByRole('button', { name: '相談して並べ替える' }).click()
}

test('本人確認をキーボードで行え、解放と再確認の閉鎖で数字が消える', async ({ page }) => {
  await startGame(page)
  const hold = page.getByRole('button', { name: '長押しで見る' })
  await hold.focus()
  await page.keyboard.down('Space')
  await expect(page.getByText('?', { exact: true })).toHaveCount(0)
  await page.keyboard.up('Space')
  await expect(page.getByText('?', { exact: true })).toHaveCount(2)

  const trigger = page.getByRole('button', { name: 'カード確認', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'カード再確認' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
  await expect(dialog.getByText('?', { exact: true })).toHaveCount(2)
  await dialog.getByRole('button', { name: '長押しで見る' }).focus()
  await page.keyboard.down('Enter')
  await expect(dialog.getByText('?', { exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.keyboard.up('Enter')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog.getByText('?', { exact: true })).toHaveCount(2)
  await mkdir('test-results/screenshots', { recursive: true })
  await page.screenshot({ path: `test-results/screenshots/card-dialog-${test.info().project.name}.png` })
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
  await page.getByRole('button', { name: '見終わった', exact: true }).click()
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await expect(page.getByRole('button', { name: '続ける', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: '次は プレイヤー2 さんへ' })).toBeVisible()
  await expect(page.getByText('?', { exact: true })).toHaveCount(2)
})

for (const count of [2, 3, 8]) {
  test(`${count}人で結果まで進み、同じメンバーで再戦できる`, async ({ page, browserName }) => {
    // GTK WebKitの操作待ちでは8人の2ラウンドが120秒を超える。機能確認の実行猶予だけを延ばす。
    test.setTimeout(browserName === 'webkit' ? 300_000 : 120_000)
    await startGame(page, count)
    for (let round = 1; round <= 2; round += 1) {
      await expect(page.getByRole('heading', { name: '次は プレイヤー1 さんへ' })).toBeVisible()
      await expect(page.getByText('?', { exact: true })).toHaveCount(count <= 3 ? 2 : 1)
      for (let i = 1; i < count; i += 1) await page.getByRole('button', { name: '見終わった' }).click()
      await page.getByRole('button', { name: '相談へ進む' }).click()
      await page.getByRole('button', { name: '相談して並べ替える' }).click()
      await page.getByRole('button', { name: 'この順でオープン' }).click()
      const cardCount = count <= 3 ? count * 2 : count
      for (let i = 0; i < cardCount; i += 1) {
        await page.getByRole('button', { name: '次をオープン' }).click()
        await expect(page.getByRole('status').filter({ hasText: `いま開いたカード（${i + 1}枚目）` })).toBeInViewport({ ratio: 1 })
      }
      await page.getByRole('button', { name: 'ふりかえりへ' }).click()
      await expect(page.getByText(`今回までのプレイ回数: ${round}`, { exact: false })).toBeVisible()
      await page.getByText('正解の順を見る', { exact: true }).click()
      const values = await page.locator('details strong').allTextContents()
      expect(values.map(Number)).toEqual([...values.map(Number)].sort((a, b) => b - a))
      if (round === 1) await page.getByRole('button', { name: 'もう一度', exact: true }).click()
    }
  })
}

test('ポインタの領域外・右クリック・別操作で秘密表示を持ち越さない', async ({ page }) => {
  await startGame(page)
  const hold = page.getByRole('button', { name: '長押しで見る' })
  await hold.scrollIntoViewIfNeeded()
  const box = (await hold.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down({ button: 'right' })
  await expect(page.getByText('?', { exact: true })).toHaveCount(2)
  await page.mouse.up({ button: 'right' })
  await page.mouse.down()
  await expect(page.getByText('?', { exact: true })).toHaveCount(0)
  await page.mouse.move(box.x - 5, box.y)
  await expect(page.getByText('?', { exact: true })).toHaveCount(2)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.getByText('?', { exact: true })).toHaveCount(2)
  await page.mouse.up()

  await page.getByRole('button', { name: 'カード確認', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const dialogHold = dialog.getByRole('button', { name: '長押しで見る' })
  await dialogHold.focus()
  await page.keyboard.down('Space')
  await expect(dialog.getByText('?', { exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'プレイヤー2', exact: true }).click()
  await page.keyboard.up('Space')
  await expect(dialog.getByText('?', { exact: true })).toHaveCount(2)
  await expect(dialog.getByText('プレイヤー2 の1枚目', { exact: true })).toBeVisible()
})

test('8人と長い同名でも3つの画面幅に収まり、指でスクロールしても順は変わらない', async ({ page, browserName, context }) => {
  test.skip(browserName !== 'chromium', 'ネイティブタッチ入力の検証はChromiumのCDPを使用')
  await goToSort(page, 8, Array(8).fill('LongParticipantName123456'))
  const rows = page.getByTestId('sort-card-row')
  await mkdir('test-results/screenshots', { recursive: true })
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const fits = await rows.evaluateAll((elements) => elements.every((row) => {
      const outer = row.getBoundingClientRect()
      return [...row.querySelectorAll('button, p')].every((child) => {
        const inner = child.getBoundingClientRect()
        return inner.left >= outer.left && inner.right <= outer.right && inner.bottom <= outer.bottom
      })
    }))
    expect(fits).toBe(true)
    await page.screenshot({ path: `test-results/screenshots/sort-${width}.png`, fullPage: true })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await rows.nth(0).scrollIntoViewIfNeeded()
  const labelBox = (await rows.nth(0).locator('p').last().boundingBox())!
  const beforeOrder = await rows.allTextContents()
  const beforeY = await page.evaluate(() => scrollY)
  const cdp = await context.newCDPSession(page)
  const x = labelBox.x + labelBox.width / 2
  const y = labelBox.y + labelBox.height / 2
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let step = 1; step <= 8; step += 1) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 20 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeY + 50)
  await expect(rows).toHaveText(beforeOrder)
  await expect(rows.first().getByRole('button', { name: /上へ/ })).toBeDisabled()
  await expect(rows.last().getByRole('button', { name: /下へ/ })).toBeDisabled()
  await rows.nth(0).getByRole('button', { name: /下へ/ }).click()
  await expect(rows.nth(1)).toContainText('（1番）')
  const handle = rows.first().getByRole('button', { name: /ドラッグ/ })
  await handle.scrollIntoViewIfNeeded()
  const handleBox = (await handle.boundingBox())!
  const targetBox = (await rows.nth(1).boundingBox())!
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  // 行の下半分が「このカードの後ろ」の挿入位置。中央境界は手前として扱う。
  await page.mouse.move(handleBox.x + handleBox.width / 2, targetBox.y + targetBox.height * 0.75, { steps: 8 })
  await page.mouse.up()
  await expect(rows.first()).toContainText('（1番）')
  await page.getByRole('button', { name: 'この順でオープン' }).click()
  await expect(page.getByRole('heading', { name: '1枚ずつオープン' })).toBeVisible()
  const open = page.getByRole('button', { name: '次をオープン' })
  const actionY = (await open.boundingBox())!.y
  await open.click()
  await expect(page.getByRole('status').filter({ hasText: 'いま開いたカード（1枚目）' })).toBeInViewport({ ratio: 1 })
  expect((await open.boundingBox())!.y).toBe(actionY)
})

test('ホームへの誤操作を取り消して同じカード順で続けられる', async ({ page }) => {
  await goToSort(page)
  const rows = page.getByTestId('sort-card-row')
  const order = await rows.allTextContents()
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'ゲームを終了しますか？' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '続ける', exact: true }).click()
  await expect(rows).toHaveText(order)

  await page.getByRole('button', { name: 'この順でオープン' }).click()
  await page.getByRole('button', { name: '次をオープン' }).click()
  await page.getByRole('button', { name: 'お題', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: '再抽選', exact: true })).toBeDisabled()
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  const progress = await page.locator('main').innerText()
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: '続ける', exact: true }).click()
  expect(await page.locator('main').innerText()).toBe(progress)
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: '終了してホームへ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'すぐ遊ぶ' })).toBeVisible()
})

test('保存済みお題が0件でも設定画面から復旧できる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ito-like-party-card-game/settings/v1', JSON.stringify({
      categoryVisibility: { everyone: false, friends: false, drinks: false },
      lastPlayerNames: ['あき', 'はる'], customTopics: [], hiddenTopicIds: [],
    }))
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await expect(page.getByRole('button', { name: '開始', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'お題を選ぶ', exact: true }).click()
  await page.getByLabel('誰でも遊べる', { exact: true }).check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('button', { name: '開始', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '開始', exact: true }).click()
  await expect(page.getByRole('heading', { name: '次は あき さんへ' })).toBeVisible()
})

test('前後の空白を除いて24文字の名前を保存し、正常な保存を修復扱いしない', async ({ page }) => {
  const name = '😀'.repeat(24)
  await startGame(page, 2, [`  ${name}  `, '  あき  '])
  await expect(page.getByRole('heading', { name: `次は ${name} さんへ` })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ito-like-party-card-game/settings/v1')!).lastPlayerNames)).toEqual([name, 'あき'])
  await page.reload()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('修復した設定はゲーム開始で上書きせず、お題管理の保存で初めて反映する', async ({ page }) => {
  await page.goto('/')
  const raw = JSON.stringify({
    customTopics: [
      { id: 'custom-one', text: '好きなもの', category: 'everyone', isBuiltin: false },
      { id: 'custom-one', text: '重複IDを残す原本', category: 'everyone', isBuiltin: false },
    ], lastPlayerNames: ['あき', 'はる'],
  })
  await page.evaluate((value) => localStorage.setItem('ito-like-party-card-game/settings/v1', value), raw)
  await page.reload()
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByRole('button', { name: '開始', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('ito-like-party-card-game/settings/v1'))).toBe(raw)
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: '終了してホームへ', exact: true }).click()
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ito-like-party-card-game/settings/v1')!).customTopics.length)).toBe(1)
})

test('個別OFFとカテゴリOFFを維持し、候補1件では再抽選しない', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((hiddenTopicIds) => localStorage.setItem('ito-like-party-card-game/settings/v1', JSON.stringify({
    categoryVisibility: { everyone: true, friends: true, drinks: false },
    hiddenTopicIds, lastPlayerNames: ['あき', 'はる'],
    customTopics: [{ id: 'custom-off', text: 'カテゴリOFFの自作お題', category: 'drinks', isBuiltin: false }],
  })), builtInTopics.map((topic) => topic.id))
  await page.reload()
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await expect(page.getByRole('button', { name: '開始', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'お題を選ぶ', exact: true }).click()
  await expect(page.getByRole('status').last()).toContainText('抽選対象0件')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await expect(page.getByRole('button', { name: '開始', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'お題を選ぶ', exact: true }).click()
  await page.getByLabel('朝ごはんに出てきたらうれしいもの', { exact: false }).check()
  await expect(page.getByRole('status').last()).toContainText('抽選対象1件')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('button', { name: '開始', exact: true }).click()
  await page.getByRole('button', { name: '見終わった' }).click()
  await page.getByRole('button', { name: '相談へ進む' }).click()
  await expect(page.getByRole('button', { name: 'お題を再抽選' })).toBeDisabled()
  await page.getByRole('button', { name: 'お題', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: '再抽選', exact: true })).toBeDisabled()
})

test('端末に保存できなくても設定と名前を今回のゲームに反映できる', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('test: storage disabled') } })
  await startGame(page, 2, ['あき', 'はる'])
  await expect(page.getByRole('status')).toContainText('保存できませんでした')
  await expect(page.getByRole('heading', { name: '次は あき さんへ' })).toBeVisible()
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: '終了してホームへ', exact: true }).click()
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  for (const category of ['誰でも遊べる', '友達向け', '飲み会向け']) await page.getByLabel(category, { exact: true }).uncheck()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await expect(page.getByRole('button', { name: '開始', exact: true })).toBeDisabled()
  await expect(page.getByLabel('プレイヤー1', { exact: true })).toHaveValue('あき')
})
