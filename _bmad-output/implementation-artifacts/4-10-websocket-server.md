# Story 4-10: WebSocket Server

## Story

**ID:** 4-10
**Key:** 4-10-websocket-server
**Title:** Set up Socket.io WebSocket server with JWT authentication and session management
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Set up Socket.io WebSocket server for real-time collaboration features. Implements JWT authentication for WebSocket handshake and session management for multi-user rooms.

This story establishes the WebSocket infrastructure that Stories 4.11-4.13 will extend with specific event handlers.

---

## Acceptance Criteria

- **AC-1:** Socket.io installed and configured
- **AC-2:** WebSocket server listens on same port as Express (HTTP upgrade)
- **AC-3:** JWT authentication on WebSocket handshake
- **AC-4:** Session management (multi-user rooms)
- **AC-5:** Connection/disconnection events handled
- **AC-6:** Integration tests for WebSocket connections

---

## Tasks/Subtasks

### Task 1: Install Socket.io
- [ ] Install Socket.io: `npm install socket.io @types/socket.io`
- [ ] Configure Socket.io with Express server

### Task 2: Implement JWT authentication
- [ ] Extract token from handshake query or headers
- [ ] Verify JWT token on connection
- [ ] Reject unauthenticated connections

### Task 3: Implement session management
- [ ] Create room-based session management
- [ ] Handle user join/leave events
- [ ] Track connected users per room

### Task 4: Test and validate
- [ ] Test WebSocket connection with valid JWT
- [ ] Test connection rejection without JWT
- [ ] Test room join/leave
- [ ] Run `npm test`

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
