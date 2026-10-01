import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RevealScreen } from './RevealScreen'

const players = [{ id: 'a', name: 'あき' }, { id: 'b', name: 'はる' }]
const cards = [
  { id: 'one', ownerId: 'a', value: 24 },
  { id: 'two', ownerId: 'b', value: 83 },
]

describe('本人だけのカード確認', () => {
  it('Spaceを押している間だけ数字を表示し、フォーカスを失ったら隠す', () => {
    render(<RevealScreen players={players} cards={cards} onComplete={vi.fn()} />)
    const hold = screen.getByRole('button', { name: '長押しで見る' })

    fireEvent.keyDown(hold, { key: ' ' })
    expect(screen.getByText('24')).toBeVisible()
    fireEvent.keyUp(hold, { key: ' ' })
    expect(screen.queryByText('24')).not.toBeInTheDocument()

    fireEvent.keyDown(hold, { key: 'Enter' })
    expect(screen.getByText('24')).toBeVisible()
    fireEvent.blur(window)
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    // 復帰やキーリピートで秘密の数字を再表示しない。
    fireEvent.keyDown(hold, { key: 'Enter', repeat: true })
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    fireEvent.keyUp(hold, { key: 'Enter' })
  })

  it('別のアプリへの切替時に隠し、戻っても再押下するまで表示しない', () => {
    render(<RevealScreen players={players} cards={cards} onComplete={vi.fn()} />)
    const hold = screen.getByRole('button', { name: '長押しで見る' })
    // jsdomにはPointerEventがないため、同じbutton情報を持つDOMイベントを送る。
    fireEvent(hold, new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    expect(screen.getByText('24')).toBeVisible()

    fireEvent(document, new Event('visibilitychange'))
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.queryByText('24')).not.toBeInTheDocument()
  })

  it.each(['pointercancel', 'lostpointercapture', 'pagehide'])('%sで数字をDOMから除き、再押下まで隠す', (eventName) => {
    render(<RevealScreen players={players} cards={cards} onComplete={vi.fn()} />)
    const hold = screen.getByRole('button', { name: '長押しで見る' })
    fireEvent(hold, new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    expect(screen.getByText('24')).toBeVisible()
    fireEvent(eventName === 'pagehide' ? window : hold, new Event(eventName, { bubbles: true }))
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    fireEvent.focus(hold)
    fireEvent.click(hold)
    expect(screen.queryByText('24')).not.toBeInTheDocument()
  })
})

describe('人狼の秘密確認', () => {
  it.each(['blur', 'pagehide', 'visibilitychange', 'pointercancel'])('%sで数字と役職をDOMから消す', (eventName) => {
    render(<RevealScreen players={players} cards={cards} roles={{ a: 'wolf', b: 'citizen' }} onComplete={vi.fn()} />)
    const hold = screen.getByRole('button', { name: '長押しで見る' })
    expect(screen.queryByText(/役職:/)).not.toBeInTheDocument()
    fireEvent(hold, new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    expect(screen.getByText('24')).toBeVisible()
    expect(screen.getByText('役職: 人狼')).toBeVisible()
    const target = eventName === 'visibilitychange' ? document : eventName === 'pointercancel' ? hold : window
    fireEvent(target, new Event(eventName, { bubbles: true }))
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    expect(screen.queryByText(/役職:/)).not.toBeInTheDocument()
  })
  it('次の人に数字と役職を持ち越さず、通常モードに役職を表示しない', () => {
    const { rerender } = render(<RevealScreen players={players} cards={cards} roles={{ a: 'wolf', b: 'citizen' }} onComplete={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: '長押しで見る' }), { key: ' ' })
    fireEvent.click(screen.getByRole('button', { name: '見終わった' }))
    expect(screen.queryByText('24')).not.toBeInTheDocument()
    expect(screen.queryByText(/役職:/)).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: '長押しで見る' }), { key: ' ' })
    expect(screen.getByText('役職: 市民')).toBeVisible()
    rerender(<RevealScreen players={players} cards={cards} onComplete={vi.fn()} />)
    expect(screen.queryByText(/役職:/)).not.toBeInTheDocument()
  })
})
