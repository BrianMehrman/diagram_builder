/**
 * FileBlock Tests
 *
 * Lightweight smoke tests following the project's R3F test pattern
 * (see NodeRenderer.test.tsx). Full WebGL rendering is not available
 * in jsdom, so tests focus on component instantiation and prop validation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FileBlock } from './FileBlock';
import type { BlockLayout } from '../layout/types';

// Mock R3F and drei to avoid WebGL requirements
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@react-three/drei', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const multiExportBlock: BlockLayout = {
  fileId: 'src/features/auth/AuthService.ts',
  position: { x: 5, y: 0, z: 3 },
  footprint: { width: 4, depth: 3 },
  isMerged: false,
  children: [
    { nodeId: 'AuthService', localPosition: { x: 0, y: 0, z: 0 } },
    { nodeId: 'AuthHelper', localPosition: { x: 2, y: 0, z: 0 } },
  ],
};

const mergedBlock: BlockLayout = {
  fileId: 'src/utils/helpers.ts',
  position: { x: -2, y: 0, z: 1 },
  footprint: { width: 2, depth: 2 },
  isMerged: true,
  children: [
    { nodeId: 'helpers', localPosition: { x: 0, y: 0, z: 0 } },
  ],
};

describe('FileBlock', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FileBlock block={multiExportBlock} districtColor="#2d4a3e" lodLevel={1} />,
    );
    expect(container).toBeDefined();
  });

  it('renders multi-export block (isMerged=false)', () => {
    const { container } = render(
      <FileBlock block={multiExportBlock} districtColor="#4a3d2d" lodLevel={2} />,
    );
    expect(container).toBeDefined();
  });

  it('renders merged block (isMerged=true)', () => {
    const { container } = render(
      <FileBlock block={mergedBlock} districtColor="#2d3a4a" lodLevel={2} />,
    );
    expect(container).toBeDefined();
  });

  it('extracts filename from full path for label', () => {
    const { container } = render(
      <FileBlock block={multiExportBlock} districtColor="#2d4a3e" lodLevel={2} />,
    );
    // At LOD 2+, the label should contain the filename
    expect(container.textContent).toContain('AuthService.ts');
  });

  it('does not render label at LOD below 2', () => {
    const { container } = render(
      <FileBlock block={multiExportBlock} districtColor="#2d4a3e" lodLevel={1} />,
    );
    expect(container.textContent).not.toContain('AuthService.ts');
  });
});
