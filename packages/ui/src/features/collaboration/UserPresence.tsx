/**
 * UserPresence Component
 *
 * Display list of users in the current collaboration session
 */

import { useCollaborationStore } from './store'

interface UserPresenceProps {
  className?: string
}

/**
 * UserPresence component
 */
function UserPresence({ className = '' }: UserPresenceProps) {
  const users = useCollaborationStore((state) => state.users)
  const currentUserId = useCollaborationStore((state) => state.currentUserId)

  const userList = Object.values(users)

  if (userList.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Users in Session ({userList.length})
      </h3>

      <div className="space-y-2">
        {userList.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
          >
            {/* User color indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: user.color }}
            />

            {/* Username */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user.username}
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </div>
            </div>

            {/* Activity status */}
            <div className="flex-shrink-0">
              {user.isActive ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
              ) : (
                <div className="w-2 h-2 bg-gray-300 rounded-full" title="Inactive" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UserPresence
