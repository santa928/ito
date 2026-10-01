/** Docker内で旧版→修正版→次版を配信し、実SW更新・操作時間・配信量を確認する。 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const root = process.cwd()
const baselineSha = 'e0b8e3cc5620a12bbda8d88af1d34c1aaeea4b72'
// SW移行の旧版とは別に、Issue #4着手前のmainを配信量の固定比較基準にする。
const bundleBaselineSha = 'b72d94f9160b0250888fe3ca26186dfe8dea253a'
const temporary = await mkdtemp(join(tmpdir(), 'ito-pwa-'))
const baseline = join(temporary, 'baseline')
const bundleBaseline = join(temporary, 'bundle-baseline')
const next = join(temporary, 'next')
const report = { baselineSha, bundleBaselineSha, transitions: [], performance: {}, gzipBytes: {} }
let browser
let server

/** 指定コピーだけでnpmを実行し、失敗時に検証を中断する。 */
function npm(cwd, args) {
  execFileSync('npm', args, { cwd, stdio: 'pipe', timeout: 180_000 })
}

/** ゲーム画面を通常操作で8人の相談段階まで進める。 */
async function toSort(page) {
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByLabel('人数').selectOption('8')
  await page.getByRole('button', { name: '開始', exact: true }).click()
  for (let i = 1; i < 8; i += 1) await page.getByRole('button', { name: '見終わった' }).click()
  await page.getByRole('button', { name: '相談へ進む' }).click()
  await page.getByRole('button', { name: '相談して並べ替える' }).click()
}

/** クリック受信から次の描画callbackまでを20回計測する。ページ状態は参照しない。 */
async function measureOperations(page) {
  await page.evaluate(() => {
    window.itoOperationSamples = []
    document.addEventListener('click', (event) => {
      if (!event.target.closest('button[aria-label$="下へ"]')) return
      const started = performance.now()
      requestAnimationFrame(() => window.itoOperationSamples.push(performance.now() - started))
    })
  })
  for (let i = 0; i < 20; i += 1) await page.getByRole('button', { name: /下へ/ }).first().click()
  await page.waitForFunction(() => window.itoOperationSamples.length === 20)
  const values = await page.evaluate(() => window.itoOperationSamples)
  const sorted = [...values].sort((a, b) => a - b)
  return { samplesMs: values, p95Ms: sorted[18], maxMs: sorted[19], browser: 'Chromium', viewport: '390x844', cpuThrottling: false }
}

/** SW本体を含む、実配信するJS/CSSのgzip量を集計する。 */
async function gzipSize(directory) {
  let total = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) total += await gzipSize(path)
    else if (/\.(js|css)$/.test(entry.name)) total += gzipSync(await readFile(path)).length
  }
  return total
}

try {
  console.log('固定した旧版と修正版・次版の本番buildを準備します。')
  await mkdir(baseline)
  execFileSync('tar', ['-x', '-C', baseline], { input: execFileSync('git', ['-c', `safe.directory=${root}`, 'archive', baselineSha], { maxBuffer: 30 * 1024 * 1024 }) })
  npm(baseline, ['ci'])
  npm(baseline, ['run', 'build'])
  await mkdir(bundleBaseline)
  execFileSync('tar', ['-x', '-C', bundleBaseline], { input: execFileSync('git', ['-c', `safe.directory=${root}`, 'archive', bundleBaselineSha], { maxBuffer: 30 * 1024 * 1024 }) })
  npm(bundleBaseline, ['ci'])
  npm(bundleBaseline, ['run', 'build'])
  npm(root, ['run', 'build'])
  await cp(root, next, { recursive: true, filter: (source) => !['.git', 'node_modules', 'dist', 'tmp', 'test-results', '.codex', '.agents'].includes(relative(root, source).split(sep)[0]) })
  await symlink(join(root, 'node_modules'), join(next, 'node_modules'), 'dir')
  const html = await readFile(join(next, 'index.html'), 'utf8')
  await writeFile(join(next, 'index.html'), html.replace('<title>価値観カード</title>', '<title>価値観カード 更新確認</title>'))
  npm(next, ['run', 'build'])

  let serving = join(baseline, 'dist')
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      if (pathname === '/observe-update') {
        response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>更新状態の観測</title>')
        return
      }
      if (!pathname.startsWith('/ito/')) { response.writeHead(404).end(); return }
      const path = resolve(serving, pathname.slice('/ito/'.length) || 'index.html')
      if (!path.startsWith(`${serving}${sep}`)) { response.writeHead(403).end(); return }
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }[extname(path)] ?? 'application/octet-stream'
      const body = await readFile(path)
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(body)
    } catch { response.writeHead(404).end() }
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${server.address().port}/ito/`
  browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  let page = await context.newPage()
  page.setDefaultTimeout(12_000)
  await page.goto(url)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await toSort(page)
  report.performance.baseline = await measureOperations(page)
  const originalOrder = await page.getByTestId('sort-card-row').allTextContents()

  serving = join(root, 'dist')
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update())
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).waiting))
  assert.deepEqual(await page.getByTestId('sort-card-row').allTextContents(), originalOrder)
  // scope外の観測ページはゲームのclientに数えられない。全ゲームタブを閉じた後の
  // 自然なactivate完了を観測し、すぐ開き直して旧workerに再接続する競合を避ける。
  const observer = await context.newPage()
  await observer.goto(new URL('/observe-update', url).href)
  await page.close()
  await observer.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/ito/')
    return registration?.active?.state === 'activated' && !registration.waiting && !registration.installing
  })
  page = await context.newPage()
  page.setDefaultTimeout(12_000)
  await page.goto(url)
  await page.getByRole('button', { name: 'すぐ遊ぶ' }).click()
  await page.getByText('抽選対象90件', { exact: true }).waitFor()
  await observer.close()
  report.transitions.push({ from: 'legacy autoUpdate', to: 'prompt', activeRoundPreservedUntilClose: true, activation: '旧版には更新UIがないため、全ゲームタブを閉じ、workerのactivate完了後に再度開くと移行。すぐに開き直すと旧版が続く場合がある' })
  await page.getByRole('button', { name: '戻る', exact: true }).click()
  await toSort(page)
  report.performance.current = await measureOperations(page)
  await page.getByRole('button', { name: 'この順でオープン' }).click()
  await page.getByRole('button', { name: '次をオープン' }).click()
  const openText = await page.locator('main').innerText()
  let navigations = 0
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) navigations += 1 })

  serving = join(next, 'dist')
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update())
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).waiting))
  assert.equal(await page.locator('main').innerText(), openText)
  assert.equal(await page.getByRole('button', { name: '更新する', exact: true }).count(), 0)
  for (let i = 1; i < 8; i += 1) await page.getByRole('button', { name: '次をオープン' }).click()
  await page.getByRole('button', { name: 'ふりかえりへ' }).click()
  assert.equal(await page.getByRole('button', { name: '更新する', exact: true }).count(), 0)
  await page.getByRole('button', { name: 'ホーム', exact: true }).click()
  await page.getByRole('button', { name: '更新する', exact: true }).waitFor()
  assert.equal(navigations, 0)
  await page.getByRole('button', { name: 'あとで', exact: true }).click()
  await page.getByRole('button', { name: '遊び方', exact: true }).click()
  await page.getByRole('button', { name: '戻る', exact: true }).click()
  assert.equal(navigations, 0)
  await page.getByRole('button', { name: '更新する', exact: true }).click()
  await page.waitForFunction(() => document.title === '価値観カード 更新確認')
  assert.equal(navigations, 1)
  report.transitions.push({ from: 'prompt', to: 'next prompt', updateDetectedDuringRound: true, resultPreserved: true, homeReturnDoesNotReload: true, explicitUpdateReloads: true })
  report.gzipBytes.baseline = await gzipSize(join(baseline, 'dist'))
  report.gzipBytes.bundleBaseline = await gzipSize(join(bundleBaseline, 'dist'))
  report.gzipBytes.current = await gzipSize(join(root, 'dist'))
  // 旧版からの累積量も残し、今回の増分と区別して報告する。
  report.gzipBytes.delta = report.gzipBytes.current - report.gzipBytes.baseline
  report.gzipBytes.featureDelta = report.gzipBytes.current - report.gzipBytes.bundleBaseline
  assert.ok(report.performance.current.p95Ms <= 100, '操作p95が100msを超えました')
  assert.ok(report.gzipBytes.featureDelta <= 10 * 1024, 'Issue #4着手前mainからのJS+CSS gzip増分が10KiBを超えました')
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/pwa-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser?.close()
  if (server) await new Promise((done) => server.close(done))
  await rm(temporary, { recursive: true, force: true })
}
