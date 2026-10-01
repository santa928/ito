import { expect, test } from '@playwright/test'

for (const width of [320, 390, 430]) {
  test.describe(`ホーム ${width}px`, () => {
    // GTK WebKitは実行中のresizeでレイアウトが前の幅に残るため、起動時に実寸を指定する。
    test.use({ viewport: { width, height: 844 } })
    test('ホームの文字と操作が小画面に収まり、画面遷移で見出しに戻る', async ({ page }) => {
      await page.goto('/')
      const play = page.getByRole('button', { name: /すぐ遊ぶ/ })
      expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(width)
      expect(await play.evaluate((button) => Number.parseFloat(getComputedStyle(button).fontSize))).toBe(24)
      expect(await play.evaluate((button) => Number(getComputedStyle(button).fontWeight))).toBeGreaterThanOrEqual(700)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const tagline = page.getByText('価値観をつなぐ。', { exact: true })
      expect(await tagline.evaluate((element) => element.getBoundingClientRect().height)).toBe(28)
      await play.click()
      await page.getByLabel('人数', { exact: true }).selectOption('8')
      await page.getByLabel('プレイヤー1', { exact: true }).fill('あき')
      await page.getByLabel('プレイヤー1', { exact: true }).press('Enter')
      await expect(page.getByLabel('プレイヤー2', { exact: true })).toBeFocused()
      await page.getByRole('button', { name: 'お題を選ぶ', exact: true }).click()
      await page.getByRole('button', { name: '戻る', exact: true }).click()
      await expect(page.getByLabel('プレイヤー1', { exact: true })).toHaveValue('あき')
      await page.getByRole('button', { name: '開始', exact: true }).click()
      await expect(page.getByRole('heading', { name: '次は あき さんへ' })).toBeFocused()
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      await expect(page.locator('[aria-current="step"]')).toHaveText('1 確認')
      await page.getByRole('button', { name: '見終わった', exact: true }).click()
      await expect(page.getByRole('heading', { name: '次は プレイヤー2 さんへ' })).toBeFocused()
      await expect(page.getByText('?', { exact: true })).toHaveCount(1)
    })
  })
}

test('お題検索は設定を変えず、削除を戻すと内容とOFF状態が復帰する', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  const search = page.getByRole('searchbox', { name: '内蔵お題を検索' })
  await search.fill('該当しないテスト検索')
  await expect(page.getByText('見つかりませんでした。', { exact: false })).toBeVisible()
  await expect(page.getByText('抽選対象90件', { exact: true })).toBeVisible()
  await search.clear()
  await page.getByRole('textbox', { name: '自作お題', exact: true }).fill('みんなで行きたい場所')
  await expect(page.getByRole('button', { name: '保存', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'お題を追加', exact: true }).click()
  await page.getByRole('checkbox', { name: '表示', exact: true }).uncheck()
  await page.getByRole('button', { name: '削除', exact: true }).click()
  await page.getByRole('button', { name: '元に戻す', exact: true }).click()
  await expect(page.getByText('みんなで行きたい場所', { exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '表示', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ito-like-party-card-game/settings/v1')!))
  expect(saved.customTopics).toHaveLength(1)
  expect(saved.customTopics[0].text).toBe('みんなで行きたい場所')
  expect(saved.hiddenTopicIds).toContain(saved.customTopics[0].id)
})

test('未保存の入力を戻る操作で失わず、明示したときだけ破棄する', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  await page.getByRole('textbox', { name: '自作お題', exact: true }).fill('まだ追加していないお題')
  await page.getByRole('button', { name: '戻る', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '変更を保存せず戻りますか？' })
  await expect(dialog.getByRole('button', { name: '編集を続ける', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('textbox', { name: '自作お題', exact: true })).toHaveValue('まだ追加していないお題')
  await page.getByRole('button', { name: '戻る', exact: true }).click()
  await dialog.getByRole('button', { name: '保存せず戻る', exact: true }).click()
  await expect(page.getByRole('button', { name: /すぐ遊ぶ/ })).toBeVisible()
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '自作お題', exact: true })).toBeEmpty()
})

test('別のお題への編集切替で入力中の本文を失わない', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  for (const text of ['編集するお題A', '編集するお題B']) {
    await page.getByRole('textbox', { name: '自作お題', exact: true }).fill(text)
    await page.getByRole('button', { name: 'お題を追加', exact: true }).click()
  }
  await page.getByRole('button', { name: '編集', exact: true }).first().click()
  const input = page.getByRole('textbox', { name: 'お題の本文を編集' })
  await input.fill('途中まで書いた内容を保持')
  await expect(page.getByRole('button', { name: '編集', exact: true })).toBeDisabled()
  await expect(input).toHaveValue('途中まで書いた内容を保持')
  await page.getByRole('button', { name: '保存', exact: true }).first().click()
  await expect(page.getByText('途中まで書いた内容を保持', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '編集', exact: true }).last()).toBeEnabled()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('button', { name: 'お題管理', exact: true }).click()
  await expect(page.getByText('途中まで書いた内容を保持', { exact: true })).toBeVisible()
  await expect(page.getByText('編集するお題B', { exact: true })).toBeVisible()
})

test('共有メタデータと配信画像が整合する', async ({ page, request }) => {
  await page.goto('/')
  const canonical = 'https://santa928.github.io/ito/'
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical)
  await expect(page.locator('meta[name="description"]')).toHaveCount(1)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  for (const [asset, width, height] of [
    ['social-card.png', 1200, 630], ['apple-touch-icon.png', 180, 180],
    ['pwa-192x192.png', 192, 192], ['pwa-512x512.png', 512, 512],
  ] as const) {
    const response = await request.get(`/${asset}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
    const bytes = await response.body()
    expect(bytes.subarray(1, 4).toString()).toBe('PNG')
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([width, height])
  }
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }),
    expect.objectContaining({ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }),
  ]))
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', manifest.theme_color)
})
