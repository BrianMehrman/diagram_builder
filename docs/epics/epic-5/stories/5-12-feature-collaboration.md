# Story 5-12: Feature Collaboration

## Story

**ID:** 5-12
**Key:** 5-12-feature-collaboration
**Title:** Implement WebSocket client for session join/leave, avatars, and position sync
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Implement real-time collaboration features using WebSocket client. Shows spatial avatars for other users, syncs positions in real-time, and manages session join/leave. Integrates with WebSocket server (Stories 4.10-4.13).

---

## Acceptance Criteria

- **AC-1:** WebSocket client connection
- **AC-2:** Session join/leave UI
- **AC-3:** Render spatial avatars for other users
- **AC-4:** Real-time position synchronization
- **AC-5:** User presence indicators
- **AC-6:** Component tests

---

## Tasks/Subtasks

### Task 1: Create WebSocket client
- [ ] Create src/shared/websocket/client.ts
- [ ] Connect to WebSocket server
- [ ] Handle connection/disconnection

### Task 2: Session join/leave
- [ ] Create SessionPanel.tsx
- [ ] Join session button
- [ ] Leave session button
- [ ] Show connected users

### Task 3: Render avatars
- [ ] Create Avatar.tsx component
- [ ] Show 3D avatars at user positions
- [ ] Label with usernames

### Task 4: Position synchronization
- [ ] Listen to position.update events
- [ ] Update avatar positions
- [ ] Broadcast local position changes

### Task 5: Presence indicators
- [ ] Show user list
- [ ] Online/offline status
- [ ] User colors/identifiers

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
