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
  await page.getByRole('button', { name: 'この順でオープン' }).click()

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: '次をオープン' }).click()
  }

  await page.getByRole('button', { name: 'ふりかえりへ' }).click()
  await expect(page.getByText('ふりかえり')).toBeVisible()
})
