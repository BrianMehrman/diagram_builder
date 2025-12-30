# Story 4-11: WebSocket Events - Position Updates

## Story

**ID:** 4-11
**Key:** 4-11-websocket-position-updates
**Title:** Implement position.update event with 50ms batching and MessagePack serialization
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement real-time camera position synchronization using WebSocket events. Position updates are batched every 50ms and serialized with MessagePack for performance.

---

## Acceptance Criteria

- **AC-1:** `position.update` event handler implemented
- **AC-2:** 50ms batching for performance
- **AC-3:** MessagePack binary serialization
- **AC-4:** Broadcast to all session participants
- **AC-5:** Integration tests for position sync

---

## Tasks/Subtasks

### Task 1: Install MessagePack
- [ ] Install @msgpack/msgpack

### Task 2: Implement position.update event
- [ ] Handle incoming position updates
- [ ] Batch updates every 50ms
- [ ] Serialize with MessagePack
- [ ] Broadcast to room

### Task 3: Test and validate
- [ ] Test position updates
- [ ] Test batching behavior
- [ ] Run `npm test`

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
