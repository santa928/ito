import { expect, test } from '@playwright/test'

test('plays one round through result screen', async ({ page }, testInfo) => {
  await page.goto(`/?cacheBust=e2e-${testInfo.project.name}`)
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByLabel('人数').selectOption('2')
  await page.getByLabel('プレイヤー2').waitFor()
  await page.getByLabel('プレイヤー1').fill('みほ')
  await page.getByLabel('プレイヤー2').fill('ゆうと')
  await page.getByRole('button', { name: '開始' }).click()

  await expect(page.getByText('次は みほ さんへ')).toBeVisible()
  await expect(page.getByText('みほ の1枚目')).toBeVisible()
  await expect(page.getByText('みほ の2枚目')).toBeVisible()
  await page.getByRole('button', { name: '見終わった' }).click()
  await expect(page.getByText('次は ゆうと さんへ')).toBeVisible()
  await expect(page.getByText('ゆうと の1枚目')).toBeVisible()
  await expect(page.getByText('ゆうと の2枚目')).toBeVisible()
  await page.getByRole('button', { name: '相談へ進む' }).click()

  await expect(page.getByText('数字は言わず')).toBeVisible()
  await page.getByRole('button', { name: '相談して並べ替える' }).click()
  await expect(page.getByText('みほ の1枚目')).toBeVisible()
  await expect(page.getByText('みほ の2枚目')).toBeVisible()
  await expect(page.getByText('ゆうと の1枚目')).toBeVisible()
  await expect(page.getByText('ゆうと の2枚目')).toBeVisible()
  const rows = page.getByTestId('sort-card-row')
  await expect(rows.nth(0)).toContainText('みほ の1枚目')
  const firstBox = await rows.nth(0).boundingBox()
  const lastBox = await rows.nth(3).boundingBox()
  expect(firstBox).not.toBeNull()
  expect(lastBox).not.toBeNull()
  if (firstBox && lastBox) {
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height * 0.8, { steps: 8 })
    await page.mouse.up()
    await expect(rows.nth(3)).toContainText('みほ の1枚目')
  }
  await page.getByRole('button', { name: 'この順でオープン' }).click()

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: '次をオープン' }).click()
  }

  await page.getByRole('button', { name: 'ふりかえりへ' }).click()
  await expect(page.getByText('ふりかえり')).toBeVisible()
})
