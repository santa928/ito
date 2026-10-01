import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatPlayerLabel } from '../domain/cardLabels'
import type { AppAction, RoundState } from '../state/appState'

/** 確定した数字だけを表示。役職は結果までDOMへ置かない。 */
function PublicOrder({ round, revealRoles = false }: { round: RoundState; revealRoles?: boolean }) {
  return <ol className="my-5 grid gap-3" aria-label="確定した並び">
    {round.sortedCardIds.map((id, index) => {
      const card = round.cards.find((candidate) => candidate.id === id)!
      const player = round.players.find((candidate) => candidate.id === card.ownerId)!
      return <li key={id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-3">
        <span>{index + 1}</span><span className="break-anywhere">{formatPlayerLabel(round.players, player)}{revealRoles ? <strong className="block">{round.roles[player.id] === 'wolf' ? '人狼' : '市民'}</strong> : null}</span><strong className="text-2xl tabular-nums">{card.value}</strong>
      </li>
    })}
  </ol>
}

/** 端末中断時は未確定の投票先を消し、受け渡し画面に戻す。 */
function PrivateBallot({ round, dispatch }: { round: RoundState; dispatch: (action: AppAction) => void }) {
  const [active, setActive] = useState(false)
  const [target, setTarget] = useState('')
  const voter = round.players[Object.keys(round.votes).length]
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    const hide = () => { setActive(false); setTarget('') }
    window.addEventListener('blur', hide)
    window.addEventListener('pagehide', hide)
    document.addEventListener('visibilitychange', hide)
    return () => {
      window.removeEventListener('blur', hide)
      window.removeEventListener('pagehide', hide)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [])
  return <>
    <ScreenHeader eyebrow={`秘密投票 ${round.ballot}回目 · ${Object.keys(round.votes).length + 1}/${round.players.length}人目`} title={`次は ${formatPlayerLabel(round.players, voter)} さんへ`} description="本人だけが操作してください。自分には投票できません。全員の確定後に集計します。確定済みの票は変更できません。" />
    {round.ballot === 2 ? <p className="mb-4 leading-7">同票の候補だけに再投票します。もう一度同票なら人狼の勝利です。</p> : null}
    {active ? <>
      <fieldset className="grid gap-3"><legend className="mb-3 font-bold">人狼だと思う人を選ぶ</legend>
        {round.players.filter((player) => player.id !== voter.id && round.voteCandidates.includes(player.id)).map((player) => <label key={player.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-[#c79b57] bg-[#fffaf0] p-3">
          <input type="radio" name="target" value={player.id} checked={target === player.id} onChange={() => setTarget(player.id)} /><span className="break-anywhere">{formatPlayerLabel(round.players, player)}</span>
        </label>)}
      </fieldset>
      <PrimaryButton className="mt-5 w-full" disabled={!target} onClick={() => { dispatch({ type: 'castVote', voterId: voter.id, targetId: target, ballot: round.ballot }); setTarget(''); setActive(false) }}>この票を確定</PrimaryButton>
      <PrimaryButton className="mt-3 w-full" variant="secondary" onClick={() => { setTarget(''); setActive(false) }}>隠して渡す</PrimaryButton>
    </> : <PrimaryButton className="w-full" onClick={() => setActive(true)}>本人の投票を始める</PrimaryButton>}
  </>
}

const reasons = {
  order: '小さい順（1→100）に正しく並びました。投票なしで市民の勝利です。',
  caught: '最多票の1人が人狼でした。市民の勝利です。',
  escaped: '最多票の1人は市民でした。人狼が逃げ切りました。',
  tie: '再投票でも同票でした。人狼を1人に絞れず、人狼が逃げ切りました。',
}

export function WerewolfScreen({ round, phase, dispatch, onAgain }: { round: RoundState; phase: 'discussion' | 'vote' | 'result'; dispatch: (action: AppAction) => void; onAgain: () => void }) {
  const [exiting, setExiting] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (phase !== 'discussion') return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [phase])
  const remaining = round.discussionDeadline === null ? 60 : Math.max(0, Math.ceil((round.discussionDeadline - now) / 1000))
  return <CardSurface>
    {phase !== 'result' ? <PrimaryButton className="mb-5" variant="secondary" onClick={() => setExiting(true)}>ホーム</PrimaryButton> : null}
    {exiting ? <Modal label="ゲームを終了しますか？" onClose={() => setExiting(false)}><h2 className="text-2xl font-black">ゲームを終了しますか？</h2><p className="my-4 leading-7">終了すると再開できません。未確定の投票先は隠します。</p><div className="grid gap-3"><PrimaryButton autoFocus onClick={() => setExiting(false)}>続ける</PrimaryButton><PrimaryButton variant="secondary" onClick={() => dispatch({ type: 'endRound' })}>終了してホームへ</PrimaryButton></div></Modal> : null}
    {phase === 'vote' ? (!exiting ? <PrivateBallot key={`${round.ballot}-${Object.keys(round.votes).length}`} round={round} dispatch={dispatch} /> : null) : <>
      <ScreenHeader eyebrow={phase === 'result' ? '人狼 · ふりかえり' : '人狼 · 議論'} title={phase === 'result' ? (round.verdict?.winner === 'citizen' ? '市民の勝利！' : '人狼の勝利！') : '数字を見て議論'} description={phase === 'result' && round.verdict ? reasons[round.verdict.reason] : '並びは間違っていました。公開前の例えや誘導をふりかえり、人狼を探しましょう。役職はまだ秘密です。'} />
      <p className="rounded-xl bg-[#edf2e9] p-3 font-bold break-anywhere">お題: {round.topic.text}</p>
      {phase === 'discussion' ? <p className="mt-5 text-center text-5xl font-black tabular-nums text-[#285b49]" role="timer" aria-label="議論の残り時間">{remaining}<span className="text-xl">秒</span></p> : null}
      <PublicOrder round={round} revealRoles={phase === 'result'} />
      {phase === 'discussion' ? <>
        <p className="mb-4 leading-7">1分間の議論のあと、順番に端末を回して秘密投票します。最多票の1人が人狼なら市民勝利。同票は1回だけ再投票、再び同票なら人狼勝利です。</p>
        {round.discussionDeadline === null ? <PrimaryButton className="w-full" onClick={() => dispatch({ type: 'startDiscussion', now: Date.now() })}>議論を始める（60秒）</PrimaryButton> : <PrimaryButton className="w-full" disabled={remaining > 0} onClick={() => dispatch({ type: 'startVote', now: Date.now() })}>秘密投票へ進む</PrimaryButton>}
      </> : <>
        {Object.keys(round.votes).length > 0 ? <details className="my-4 rounded-xl border border-[#c79b57] p-3"><summary className="min-h-11 py-2 font-bold">最終投票を見る</summary><ul className="grid gap-3">{Object.entries(round.votes).map(([voter, target]) => <li className="break-anywhere" key={voter}>{formatPlayerLabel(round.players, round.players.find((p) => p.id === voter)!)} → {formatPlayerLabel(round.players, round.players.find((p) => p.id === target)!)}</li>)}</ul></details> : null}
        <div className="grid grid-cols-2 gap-3"><PrimaryButton variant="secondary" onClick={() => dispatch({ type: 'endRound' })}>ホーム</PrimaryButton><PrimaryButton onClick={onAgain}>もう一度</PrimaryButton></div>
      </>}
    </>}
  </CardSurface>
}
