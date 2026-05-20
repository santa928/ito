import { useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'

type SetupScreenProps = {
  initialNames: string[]
  onBack: () => void
  onStart: (names: string[]) => void
}

/** 参加人数と任意のプレイヤー名を入力する準備画面。 */
export function SetupScreen({ initialNames, onBack, onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(Math.max(2, initialNames.length || 3))
  const [names, setNames] = useState<string[]>(initialNames.length > 0 ? initialNames : ['', '', ''])

  const visibleNames = Array.from({ length: playerCount }, (_, index) => names[index] ?? '')

  function updateName(index: number, value: string) {
    const nextNames = [...names]
    nextNames[index] = value
    setNames(nextNames)
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="準備" title="遊ぶ人を決める" description="名前は空でも始められます。" />
      <label className="grid gap-2 text-sm font-bold text-[#5a4631]">
        人数
        <select
          aria-label="人数"
          className="min-h-12 rounded-xl border border-[#c79b57] bg-[#fff8e9] px-3 text-base font-bold shadow-inner"
          value={playerCount}
          onChange={(event) => setPlayerCount(Number(event.target.value))}
        >
          {[2, 3, 4, 5, 6, 7, 8].map((count) => (
            <option key={count} value={count}>
              {count}人
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 grid gap-3">
        {visibleNames.map((name, index) => (
          <label key={index} className="grid gap-2 text-sm font-bold text-[#5a4631]">
            プレイヤー{index + 1}
            <input
              aria-label={`プレイヤー${index + 1}`}
              className="min-h-12 rounded-xl border border-[#c79b57] bg-[#fff8e9] px-3 text-base font-bold shadow-inner"
              value={name}
              onChange={(event) => updateName(index, event.target.value)}
              placeholder={`プレイヤー${index + 1}`}
            />
          </label>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={onBack}>
          戻る
        </PrimaryButton>
        <PrimaryButton onClick={() => onStart(visibleNames)}>開始</PrimaryButton>
      </div>
    </CardSurface>
  )
}
