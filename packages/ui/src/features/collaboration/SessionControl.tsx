/**
 * SessionControl Component
 *
 * UI for joining and leaving collaboration sessions
 */

import { useState } from 'react'
import { useCollaborationStore } from './store'

interface SessionControlProps {
  className?: string
}

/**
 * Generate unique user ID
 */
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * SessionControl component
 */
function SessionControl({ className = '' }: SessionControlProps) {
  const [sessionId, setSessionId] = useState('')
  const [username, setUsername] = useState('')
  const [showJoinForm, setShowJoinForm] = useState(false)

  const currentSession = useCollaborationStore((state) => state.currentSession)
  const isConnected = useCollaborationStore((state) => state.isConnected)
  const connectionError = useCollaborationStore((state) => state.connectionError)
  const joinSession = useCollaborationStore((state) => state.joinSession)
  const leaveSession = useCollaborationStore((state) => state.leaveSession)

  const handleJoin = () => {
    if (!sessionId.trim() || !username.trim()) {
      return
    }

    const userId = generateUserId()
    joinSession(sessionId.trim(), userId, username.trim())
    setShowJoinForm(false)
  }

  const handleLeave = () => {
    leaveSession()
    setSessionId('')
    setUsername('')
  }

  if (currentSession) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Collaboration Session</h3>
            <p className="text-xs text-gray-600 mt-1">Session: {currentSession.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-3">
          {currentSession.userCount} user{currentSession.userCount !== 1 ? 's' : ''} in session
        </div>

        {connectionError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {connectionError}
          </div>
        )}

        <button
          onClick={handleLeave}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Leave Session
        </button>
      </div>
    )
  }

  if (!showJoinForm) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Collaboration</h3>
        <p className="text-xs text-gray-600 mb-4">
          Join a session to collaborate with others in real-time
        </p>
        <button
          onClick={() => setShowJoinForm(true)}
          className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Join Session
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Join Collaboration Session</h3>

      <div className="space-y-3">
        <div>
          <label htmlFor="session-id" className="block text-xs font-medium text-gray-700 mb-1">
            Session ID
          </label>
          <input
            id="session-id"
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter session ID"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleJoin}
            disabled={!sessionId.trim() || !username.trim()}
            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors"
          >
            Join
          </button>
          <button
            onClick={() => setShowJoinForm(false)}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionControl
