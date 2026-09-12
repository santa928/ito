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
