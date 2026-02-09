# Story 9.6: Node Clustering at High Zoom

Status: review

## Story

**ID:** 9-6
**Key:** 9-6-node-clustering-high-zoom
**Title:** Node Clustering at High Zoom
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** MEDIUM - Performance and readability at city zoom

**As a** developer viewing a large codebase from far away,
**I want** large districts to collapse into a single compound building,
**So that** the city remains readable and performant at city-level zoom.

---

## Acceptance Criteria

- **AC-1:** Districts with more than 20 nodes (configurable threshold) render as a single compound building with count badge at LOD level 1

- **AC-2:** Zooming to district level (LOD 2) expands the compound building into individual buildings

- **AC-3:** Clustering threshold is configurable via radial layout config (default 20)

- **AC-4:** Cluster utility functions are pure and have co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create cluster utility functions (AC: 3, 4)
- [x] Create `packages/ui/src/features/canvas/layout/engines/clusterUtils.ts`
- [x] `shouldCluster(nodeCount, threshold)` — returns boolean
- [x] `createClusterMetadata(districtId, nodeIds, positions)` — returns cluster info (count, center position, bounding size)
- [x] Create `packages/ui/src/features/canvas/layout/engines/clusterUtils.test.ts` — 11 tests

### Task 2: Create ClusterBuilding component (AC: 1)
- [x] Create `packages/ui/src/features/canvas/components/ClusterBuilding.tsx`
- [x] R3F component rendering a larger combined building shape (scaled by log2 of node count)
- [x] Display count badge (Text showing "{N} files") and district label
- [x] Accept props: `position`, `nodeCount`, `districtName`, `size`

### Task 3: Integrate clustering into CityView (AC: 1, 2)
- [x] Group internal files by directory, check node count against threshold (20)
- [x] At LOD 1: render ClusterBuilding for districts exceeding threshold
- [x] At LOD 2+: render individual buildings (clusters array empty)
- [x] LOD transition handled by existing lodLevel store state

---

## Dev Notes

### Architecture & Patterns

**LOD-driven rendering:** The lodLevel from the store determines whether to show clusters or individual buildings. This is a simple conditional render, not an animation.

**Cluster position:** The cluster building renders at the centroid of its constituent nodes' positions.

**Performance benefit:** Clustering reduces draw calls for large codebases. A 1000-node codebase with 10 districts might only render 10 cluster buildings at city zoom instead of 1000 individual meshes.

### Scope Boundaries

- **DO:** Create cluster utilities and ClusterBuilding component
- **DO:** Integrate into CityView with LOD-based switching
- **DO NOT:** Animate the cluster expand/collapse transition (simple show/hide)
- **DO NOT:** Modify the radial layout engine

### References

- `packages/ui/src/features/canvas/store.ts` — lodLevel state
- `packages/ui/src/features/canvas/views/CityView.tsx` — rendering integration point

---

## Dev Agent Record

### Implementation Plan
- Created pure cluster utilities (`shouldCluster`, `createClusterMetadata`) with full test coverage
- Created ClusterBuilding R3F component with count badge and district label
- Integrated into CityView with LOD-driven conditional rendering
- At LOD 1: districts with >20 nodes render as a single ClusterBuilding; individual nodes are hidden
- At LOD 2+: clusters array is empty, all individual buildings render normally

### Completion Notes
- **clusterUtils.ts:** Two pure functions. `shouldCluster(count, threshold)` returns boolean. `createClusterMetadata(districtId, nodeIds, positions)` computes centroid position and bounding size from layout positions, with graceful handling of missing positions and minimum size of 1.
- **ClusterBuilding.tsx:** R3F component with semi-transparent box scaled by `log2(nodeCount)` for height, 50% of cluster bounding size for width/depth (min 3). Shows "{N} files" badge and district name label. Uses district color from `getDistrictColor`.
- **CityView integration:** Groups internal files by directory path. At LOD 1, builds clusters for districts exceeding 20-node threshold, hides individual buildings via `clusteredNodeIds` Set. At LOD 2+, clusters array is empty so all individual buildings render.
- **Tests:** 11 new unit tests for cluster utilities (shouldCluster: 5, createClusterMetadata: 6). 252 tests passing across 17 non-DOM test files, zero regressions, zero TS errors.

## File List
- `packages/ui/src/features/canvas/layout/engines/clusterUtils.ts` (NEW — cluster utility functions)
- `packages/ui/src/features/canvas/layout/engines/clusterUtils.test.ts` (NEW — 11 unit tests)
- `packages/ui/src/features/canvas/components/ClusterBuilding.tsx` (NEW — cluster building R3F component)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — LOD-based cluster rendering)

---

## Change Log
- 2026-02-05: Implemented node clustering with pure utilities, ClusterBuilding component, and CityView LOD integration. 11 new tests, 252 total passing, zero regressions.
