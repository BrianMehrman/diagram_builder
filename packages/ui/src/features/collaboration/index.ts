/**
 * Collaboration Feature
 *
 * WebSocket client, session join/leave, spatial avatars,
 * real-time position synchronization, and user presence indicators.
 */

export { default as SessionControl } from './SessionControl'
export { default as UserPresence } from './UserPresence'
export { default as SpatialAvatar } from './SpatialAvatar'
export { default as useWebSocket } from './useWebSocket'
export { useCollaborationStore } from './store'
export type { User, Session, CollaborationState } from './store'
