import { registerSW } from 'virtual:pwa-register'

type UpdateState = { waiting: boolean; readyToReload: boolean; error: string | null }
let state: UpdateState = { waiting: false, readyToReload: false, error: null }
const listeners = new Set<() => void>()
let updateWorker: (() => Promise<void>) | undefined

/** 更新通知を購読中の画面へ配信する。ラウンドの値は保持しない。 */
function publish(update: Partial<UpdateState>): void {
  state = { ...state, ...update }
  listeners.forEach((listener) => listener())
}

/** StrictModeの外で一度だけSWを登録する。workerの切替だけでは再読込しない。 */
export function registerGameUpdates(): void {
  if (updateWorker) return
  updateWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => publish({ waiting: true, error: null }),
    onNeedReload: () => publish({ readyToReload: true, waiting: false }),
    onRegisterError: () => publish({ error: '更新を確認できませんでした。接続を確認して、あとでお試しください。' }),
  })
}

/** ホームにいる利用者が明示的に選んだ場合だけ待機中workerを有効化する。 */
export async function applyGameUpdate(): Promise<void> {
  try {
    await updateWorker?.()
  } catch {
    publish({ error: '更新できませんでした。ゲームはそのまま続けられます。' })
  }
}

/** Reactから参照する更新状態のスナップショットを返す。 */
export function getUpdateState(): UpdateState {
  return state
}

/** 更新状態の購読と解除を行う。 */
export function subscribeToUpdates(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
