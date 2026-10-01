import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

async function setup(page: Page, count = 4, names: string[] = []) {
  await page.addInitScript(() => { Math.random = () => 0 }) // 配札1..人数、人狼は最初の1人。実運用にテスト入口は追加しない。
  await page.goto('/')
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByLabel('モード').selectOption('werewolf')
  expect(await page.getByLabel('人数').locator('option').allTextContents()).toEqual(['4人', '5人', '6人', '7人', '8人'])
  await page.getByLabel('人数').selectOption(String(count))
  for (const [index, name] of names.entries()) await page.getByLabel(`プレイヤー${index + 1}`, { exact: true }).fill(name)
  await page.getByRole('button', { name: '開始', exact: true }).click()
}
async function sort(page: Page, count: number) {
  for (let i = 1; i < count; i++) await page.getByRole('button', { name: '見終わった', exact: true }).click()
  await page.getByRole('button', { name: '相談へ進む' }).click()
  await expect(page.getByText('小さい順（1→100）', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '相談して並べ替える' }).click()
}
async function lock(page: Page) {
  await page.getByRole('button', { name: '並びを確定・数字公開', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '並びを確定しますか？' })).toBeVisible()
  await page.getByRole('button', { name: '確定して数字を公開', exact: true }).click()
}
async function ballot(page: Page, targets: number[]) {
  for (const target of targets) {
    await expect(page.locator('input[name="target"]')).toHaveCount(0)
    await page.getByRole('button', { name: '本人の投票を始める' }).click()
    await page.getByRole('radio', { name: `プレイヤー${target}`, exact: true }).check()
    await page.getByRole('button', { name: 'この票を確定', exact: true }).click()
  }
}
for (const count of [4, 8]) {
  test(`人狼${count}人の正解完走と再戦・秘密保護`, async ({ page }) => {
    await setup(page, count)
    const hold = page.getByRole('button', { name: '長押しで見る' })
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await hold.focus()
    await page.keyboard.down('Space')
    await expect(page.getByText('役職: 人狼', { exact: true })).toBeVisible()
    await page.keyboard.up('Space')
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await hold.focus()
    await page.keyboard.down('Enter')
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await page.keyboard.up('Enter')
    await sort(page, count)
    await page.getByRole('button', { name: 'カード確認', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'カード再確認' })
    await dialog.getByRole('button', { name: '長押しで見る' }).focus()
    await page.keyboard.down('Space')
    await expect(dialog.getByText('役職: 人狼', { exact: true })).toBeVisible()
    await page.keyboard.up('Space')
    await dialog.getByRole('button', { name: '閉じる', exact: true }).click()
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await page.getByRole('button', { name: '並びを確定・数字公開' }).click()
    await page.getByRole('button', { name: '並べ替えに戻る' }).click()
    await expect(page.getByTestId('sort-card-row')).toHaveCount(count)
    await lock(page)
    await expect(page.getByRole('heading', { name: '市民の勝利！' })).toBeVisible()
    await expect(page.getByRole('button', { name: '本人の投票を始める' })).toHaveCount(0)
    await expect(page.getByRole('list', { name: '確定した並び' }).getByText('人狼', { exact: true })).toHaveCount(1)
    await page.getByRole('button', { name: 'もう一度' }).click()
    await expect(page.getByText('?', { exact: true })).toHaveCount(1)
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await sort(page, count)
    await lock(page)
    await expect(page.getByRole('heading', { name: '市民の勝利！' })).toBeVisible()
  })
}
for (const outcome of ['caught', 'escaped', 'tie'] as const) {
  test(`公開後の議論・秘密投票・${outcome}`, async ({ page }) => {
    await page.clock.install()
    await setup(page)
    await sort(page, 4)
    await page.getByRole('button', { name: 'プレイヤー1 のカードを下へ', exact: true }).click()
    await lock(page)
    await expect(page.getByRole('heading', { name: '数字を見て議論' })).toBeVisible()
    await expect(page.getByRole('list', { name: '確定した並び' })).toContainText('1')
    await expect(page.getByText('役職: 人狼')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'カード確認', exact: true })).toHaveCount(0)
    await expect(page.getByTestId('sort-card-row')).toHaveCount(0)
    await page.getByRole('button', { name: '議論を始める（60秒）' }).click()
    await expect(page.getByRole('button', { name: '秘密投票へ進む' })).toBeDisabled()
    await page.clock.fastForward(60_000)
    await page.getByRole('button', { name: '秘密投票へ進む' }).click()
    await page.getByRole('button', { name: '本人の投票を始める' }).click()
    await expect(page.getByRole('radio', { name: 'プレイヤー1', exact: true })).toHaveCount(0)
    await page.getByRole('radio', { name: 'プレイヤー2', exact: true }).check()
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(page.locator('input[name="target"]')).toHaveCount(0)
    await page.getByRole('button', { name: '本人の投票を始める' }).click()
    await expect(page.getByRole('button', { name: 'この票を確定' })).toBeDisabled()
    await page.getByRole('radio', { name: 'プレイヤー2', exact: true }).check()
    await page.getByRole('button', { name: 'ホーム', exact: true }).click()
    await expect(page.locator('input[name="target"]')).toHaveCount(0)
    await page.getByRole('button', { name: '続ける', exact: true }).click()
    await ballot(page, outcome === 'caught' ? [2, 1, 1, 1] : outcome === 'escaped' ? [2, 3, 2, 2] : [2, 1, 1, 2])
    if (outcome === 'tie') {
      await expect(page.getByText('同票の候補だけに再投票します。', { exact: false })).toBeVisible()
      await ballot(page, [2, 1, 1, 2])
    }
    await expect(page.getByRole('heading', { name: outcome === 'caught' ? '市民の勝利！' : '人狼の勝利！' })).toBeVisible()
    await expect(page.getByRole('list', { name: '確定した並び' }).getByText('人狼', { exact: true })).toHaveCount(1)
    await page.getByRole('button', { name: 'もう一度' }).click()
    await sort(page, 4)
    await page.getByRole('button', { name: 'プレイヤー1 のカードを下へ', exact: true }).click()
    await lock(page)
    await expect(page.getByRole('button', { name: '議論を始める（60秒）' })).toBeVisible()
  })
}
for (const width of [320, 390, 430]) {
  test.describe(`人狼 ${width}px`, () => {
    // サイズ変更のエミュレーション誤差を避け、各幅の新しいcontextでプレイする。
    test.use({ viewport: { width, height: 844 } })
    test('人狼の新画面は操作領域と横幅を保つ', async ({ page }, testInfo) => {
      await page.clock.install()
      await setup(page, 8, Array(8).fill('LongParticipantName123456'))
      await sort(page, 8)
      await page.getByTestId('sort-card-row').first().getByRole('button', { name: /下へ/ }).click()
      await lock(page)
      await mkdir('test-results/screenshots', { recursive: true })
      async function snapshot(phase: string) {
        expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(width)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        expect(await page.locator('button:visible, label:has(input[type="radio"])').evaluateAll((controls) => controls.every((control) => { const r = control.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 }))).toBe(true)
        await page.screenshot({ path: `test-results/screenshots/werewolf-${phase}-${width}-${testInfo.project.name}.png`, fullPage: true })
      }
      await snapshot('discussion')
      await page.getByRole('button', { name: '議論を始める（60秒）' }).click()
      await page.clock.fastForward(60_000)
      await page.getByRole('button', { name: '秘密投票へ進む' }).click()
      await snapshot('handoff')
      await page.getByRole('button', { name: '本人の投票を始める' }).click()
      await snapshot('ballot')
      for (let voter = 1; voter <= 8; voter++) {
        if (voter > 1) await page.getByRole('button', { name: '本人の投票を始める' }).click()
        await page.getByRole('radio').first().check()
        await page.getByRole('button', { name: 'この票を確定', exact: true }).click()
      }
      await expect(page.getByRole('heading', { name: '市民の勝利！' })).toBeVisible()
      await snapshot('result')
    })
  })
}

test('人狼の長押しでボタンが動かず、微小な指移動で役職が消えない', async ({ page }) => {
  await setup(page)
  const hold = page.getByRole('button', { name: '長押しで見る' })
  await hold.scrollIntoViewIfNeeded()
  for (const offset of [4, 28]) {
    const before = (await hold.boundingBox())!
    await page.mouse.move(before.x + before.width / 2, before.y + offset)
    await page.mouse.down()
    await expect(page.getByText('役職: 人狼', { exact: true })).toBeVisible()
    const after = (await hold.boundingBox())!
    expect(after.y).toBe(before.y)
    expect(after.height).toBe(before.height)
    await page.mouse.move(before.x + before.width / 2 + 1, before.y + offset + 1)
    await expect(page.getByText('役職: 人狼', { exact: true })).toBeVisible()
    await page.mouse.up()
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
  }
})

test('人狼のタッチ長押しは微小移動で安定し、領域外・解放・キャンセルで秘密を隠す', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'ネイティブタッチ入力はChromiumのCDPを使用')
  await setup(page)
  const hold = page.getByRole('button', { name: '長押しで見る' })
  await hold.scrollIntoViewIfNeeded()
  const before = (await hold.boundingBox())!
  const cdp = await context.newCDPSession(page)
  const x = before.x + before.width / 2
  const y = before.y + 4
  for (const end of ['outside', 'release', 'cancel'] as const) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await expect(page.getByText('役職: 人狼', { exact: true })).toBeVisible()
    expect(await hold.boundingBox()).toEqual(before)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 1, y: y + 1 }] })
    await expect(page.getByText('役職: 人狼', { exact: true })).toBeVisible()
    if (end === 'outside') {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: before.y - 2 }] })
      await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: end === 'cancel' ? 'touchCancel' : 'touchEnd', touchPoints: [] })
    await expect(page.getByText('役職:', { exact: false })).toHaveCount(0)
    await expect(page.getByText('?', { exact: true })).toHaveCount(1)
  }
  await cdp.detach()
})
