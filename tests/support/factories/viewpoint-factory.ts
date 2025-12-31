/**
 * Viewpoint Data Factory
 *
 * Factory functions for generating test viewpoint data.
 * Uses @faker-js/faker for dynamic, parallel-safe data generation.
 */

import { faker } from '@faker-js/faker';

export type Viewpoint = {
  id: string;
  name: string;
  description?: string;
  repositoryId: string;
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  filter?: {
    nodeTypes?: string[];
    languages?: string[];
  };
  lodLevel: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateViewpointInput = Omit<Viewpoint, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateViewpointInput = Partial<Omit<Viewpoint, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>;

/**
 * Create a viewpoint with overrides
 */
export const createViewpoint = (overrides: Partial<Viewpoint> = {}): Viewpoint => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  repositoryId: faker.string.uuid(),
  camera: {
    position: {
      x: faker.number.float({ min: -100, max: 100 }),
      y: faker.number.float({ min: -100, max: 100 }),
      z: faker.number.float({ min: -100, max: 100 }),
    },
    target: {
      x: faker.number.float({ min: -100, max: 100 }),
      y: faker.number.float({ min: -100, max: 100 }),
      z: faker.number.float({ min: -100, max: 100 }),
    },
  },
  filter: {
    nodeTypes: faker.helpers.arrayElements(['file', 'class', 'function'], { min: 1, max: 3 }),
    languages: faker.helpers.arrayElements(['typescript', 'javascript', 'python'], { min: 1, max: 2 }),
  },
  lodLevel: faker.number.int({ min: 1, max: 5 }),
  isPublic: faker.datatype.boolean(),
  createdBy: faker.string.uuid(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

/**
 * Create viewpoint creation request
 */
export const createViewpointInput = (overrides: Partial<CreateViewpointInput> = {}): CreateViewpointInput => {
  const viewpoint = createViewpoint(overrides);

  return {
    name: viewpoint.name,
    description: viewpoint.description,
    repositoryId: viewpoint.repositoryId,
    camera: viewpoint.camera,
    filter: viewpoint.filter,
    lodLevel: viewpoint.lodLevel,
    isPublic: viewpoint.isPublic,
    createdBy: viewpoint.createdBy,
  };
};

/**
 * Create viewpoint update request
 */
export const createViewpointUpdate = (overrides: Partial<UpdateViewpointInput> = {}): UpdateViewpointInput => ({
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  isPublic: faker.datatype.boolean(),
  ...overrides,
});

/**
 * Create multiple viewpoints
 */
export const createViewpoints = (count: number, overrides: Partial<Viewpoint> = {}): Viewpoint[] =>
  Array.from({ length: count }, () => createViewpoint(overrides));
