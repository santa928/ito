import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('does not show home decorations that look like round state', () => {
    render(<HomeScreen onPlay={vi.fn()} onTopics={vi.fn()} onHowToPlay={vi.fn()} />)

    expect(screen.queryByText('1枚目')).not.toBeInTheDocument()
    expect(screen.queryByText('2枚目')).not.toBeInTheDocument()
    expect(screen.queryByText('ライフ')).not.toBeInTheDocument()
    expect(screen.queryByText('並べる順番')).not.toBeInTheDocument()
  })
})
