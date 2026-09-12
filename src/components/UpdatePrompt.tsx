import { useEffect, useState, useSyncExternalStore } from 'react'
import { applyGameUpdate, getUpdateState, subscribeToUpdates } from '../pwa'
import { PrimaryButton } from './PrimaryButton'

/** ホームでのみ表示する更新案内。別画面へ移動したら更新同意を持ち越さない。 */
export function UpdatePrompt({ hasUnsavedSettings }: { hasUnsavedSettings: boolean }) {
  const update = useSyncExternalStore(subscribeToUpdates, getUpdateState)
  const [requested, setRequested] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (requested && update.readyToReload) window.location.reload()
  }, [requested, update.readyToReload])

  if (dismissed || (!update.waiting && !update.readyToReload && !update.error)) return null

  return (
    <aside className="mb-4 grid gap-3 rounded-xl border border-[#c79b57] bg-[#fffaf0] p-4" aria-label="アプリの更新">
      <p role="status" className="text-sm leading-6">{update.error ?? '新しいバージョンがあります。更新すると画面を再読み込みします。'}</p>
      {hasUnsavedSettings ? <p className="text-sm leading-6">保存できなかった名前やお題設定は、更新すると失われます。</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={() => setDismissed(true)}>あとで</PrimaryButton>
        {update.waiting || update.readyToReload ? (
          <PrimaryButton disabled={requested && !update.error} onClick={() => { setRequested(true); void applyGameUpdate() }}>更新する</PrimaryButton>
        ) : null}
      </div>
    </aside>
  )
}
