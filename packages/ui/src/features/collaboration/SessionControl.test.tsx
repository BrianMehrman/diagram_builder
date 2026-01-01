/**
 * SessionControl Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SessionControl from './SessionControl'
import { useCollaborationStore } from './store'

vi.mock('./useWebSocket', () => ({
  default: vi.fn(() => ({ socket: null, isConnected: false })),
}))

describe('SessionControl', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset()
  })

  it('should render join button when not in session', () => {
    render(<SessionControl />)
    expect(screen.getByText('Join Session')).toBeTruthy()
  })

  it('should show form when join button is clicked', () => {
    render(<SessionControl />)
    fireEvent.click(screen.getByText('Join Session'))

    expect(screen.getByLabelText('Session ID')).toBeTruthy()
    expect(screen.getByLabelText('Your Name')).toBeTruthy()
  })

  it('should join session with valid inputs', () => {
    render(<SessionControl />)
    fireEvent.click(screen.getByText('Join Session'))

    fireEvent.change(screen.getByLabelText('Session ID'), {
      target: { value: 'session-123' },
    })
    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Alice' },
    })

    fireEvent.click(screen.getByText('Join'))

    const state = useCollaborationStore.getState()
    expect(state.currentSession?.id).toBe('session-123')
    expect(state.currentUsername).toBe('Alice')
  })

  it('should render session info when in session', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    render(<SessionControl />)

    await waitFor(() => {
      expect(screen.queryByText(/session-123/)).toBeTruthy()
    })
  })

  it('should leave session when button clicked', async () => {
    useCollaborationStore.getState().joinSession('session-123', 'user-1', 'Alice')
    render(<SessionControl />)

    await waitFor(() => {
      expect(screen.queryByText(/session-123/)).toBeTruthy()
    })

    const leaveButton = screen.getByText('Leave Session')
    fireEvent.click(leaveButton)

    await waitFor(() => {
      const state = useCollaborationStore.getState()
      expect(state.currentSession).toBeNull()
    })
  })
})
