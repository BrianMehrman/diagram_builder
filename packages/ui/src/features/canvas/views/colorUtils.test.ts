import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDirectoryColor, getDirectoryFromLabel, resetDirectoryColors,
  COLOR_PALETTE, EXTERNAL_COLOR, BASE_CLASS_COLOR,
} from './colorUtils';

describe('getDirectoryFromLabel', () => {
  it('returns root for undefined', () => {
    expect(getDirectoryFromLabel(undefined)).toBe('root');
  });
  it('returns root when no slash', () => {
    expect(getDirectoryFromLabel('file.ts')).toBe('root');
  });
  it('extracts directory path', () => {
    expect(getDirectoryFromLabel('src/utils/file.ts')).toBe('src/utils');
  });
});

describe('getDirectoryColor', () => {
  beforeEach(() => resetDirectoryColors());

  it('returns same color for same directory', () => {
    expect(getDirectoryColor('src/utils')).toBe(getDirectoryColor('src/utils'));
  });
  it('returns different colors for different directories', () => {
    expect(getDirectoryColor('src/a')).not.toBe(getDirectoryColor('src/b'));
  });
  it('cycles through COLOR_PALETTE when exhausted', () => {
    for (let i = 0; i < COLOR_PALETTE.length + 2; i++) {
      getDirectoryColor(`dir/${i}`);
    }
    // should not throw
  });
});

describe('constants', () => {
  it('EXTERNAL_COLOR is a hex string', () => {
    expect(EXTERNAL_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('BASE_CLASS_COLOR is a hex string', () => {
    expect(BASE_CLASS_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
