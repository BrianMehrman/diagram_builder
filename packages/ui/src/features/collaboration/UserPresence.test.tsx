/**
 * UserPresence Component Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import UserPresence from './UserPresence'
import { useCollaborationStore } from './store'

describe('UserPresence', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset()
  })

  it('should render nothing when no users', () => {
    const { container } = render(<UserPresence />)
    expect(container.firstChild).toBeNull()
  })

  it('should render list of users', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().addUser({
      id: 'user-2',
      username: 'Bob',
      color: '#3b82f6',
      position: { x: 0, y: 0, z: 0 },
      isActive: true,
    })

    render(<UserPresence />)

    expect(screen.getByText(/Alice/)).toBeTruthy()
    expect(screen.getByText(/Bob/)).toBeTruthy()
  })

  it('should indicate current user with (You)', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    render(<UserPresence />)

    expect(screen.getByText(/(You)/)).toBeTruthy()
  })

  it('should show user count', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    useCollaborationStore.getState().addUser({
      id: 'user-2',
      username: 'Bob',
      color: '#3b82f6',
      position: { x: 0, y: 0, z: 0 },
      isActive: true,
    })

    render(<UserPresence />)
    expect(screen.getByText(/Users in Session/)).toBeTruthy()
  })

  it('should display user color', () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    const { container } = render(<UserPresence />)

    const colorIndicator = container.querySelector('[style*="background-color"]')
    expect(colorIndicator).toBeTruthy()
  })
})
