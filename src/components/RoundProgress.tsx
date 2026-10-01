import type { GameMode } from '../domain/werewolf'

type RoundPhase = 'reveal' | 'topic' | 'sort' | 'open' | 'discussion' | 'vote'

const steps: { phase: RoundPhase; label: string }[] = [
  { phase: 'reveal', label: '確認' },
  { phase: 'topic', label: 'お題' },
  { phase: 'sort', label: '並べる' },
  { phase: 'open', label: '開く' },
]

/** 画面状態だけから進行位置を伝える。操作やゲーム状態は持たない。 */
export function RoundProgress({ phase, mode = 'normal' }: { phase: string; mode?: GameMode }) {
  const visibleSteps = mode === 'werewolf'
    ? [...steps.slice(0, 3), { phase: 'discussion', label: '議論' }, { phase: 'vote', label: '投票' }]
    : steps
  return (
    <ol aria-label="ゲームの進行" className={`mb-3 grid ${mode === 'werewolf' ? 'grid-cols-5' : 'grid-cols-4'} gap-1 rounded-xl bg-[#fff7e6] p-2 text-center text-xs font-bold text-[#6a563d]`}>
      {visibleSteps.map((step, index) => (
        <li key={step.phase} aria-current={phase === step.phase ? 'step' : undefined} className={`rounded-lg px-1 py-2 ${phase === step.phase ? 'bg-[#285b49] text-white' : ''}`}>
          <span className="tabular-nums">{index + 1}</span> {step.label}
        </li>
      ))}
    </ol>
  )
}
