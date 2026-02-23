import { describe, it, expect, vi } from 'vitest';
import { createInfrastructureElement } from './InfrastructureFactory';
import type { GraphNode } from '../../../shared/types';

vi.mock('../components/infrastructure', () => ({
  Harbor: () => null, Airport: () => null, PowerStation: () => null,
  WaterTower: () => null, CityGate: () => null, MunicipalBuilding: () => null,
}));

const pos = { x: 0, y: 0, z: 0 };

function makeExternal(infraType: string): GraphNode {
  return { id: 'ext1', type: 'file', label: 'ext1', lod: 1, isExternal: true, metadata: { infrastructureType: infraType } };
}

describe('createInfrastructureElement', () => {
  it('returns null for general type', () => {
    expect(createInfrastructureElement(makeExternal('general'), pos)).toBeNull();
  });
  it('returns null when no metadata', () => {
    expect(createInfrastructureElement({ id: 'x', type: 'file', label: 'x', lod: 1, metadata: {} }, pos)).toBeNull();
  });
  it('returns element for database', () => {
    expect(createInfrastructureElement(makeExternal('database'), pos)).not.toBeNull();
  });
  it('returns element for api', () => {
    expect(createInfrastructureElement(makeExternal('api'), pos)).not.toBeNull();
  });
  it('returns null for unknown type', () => {
    expect(createInfrastructureElement(makeExternal('unknown-type'), pos)).toBeNull();
  });
});
