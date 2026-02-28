import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders skip navigation links', () => {
    render(<App />)
    expect(screen.getByText('Skip to canvas')).toBeDefined()
  })

  it('renders the app shell without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeDefined()
  })
})
