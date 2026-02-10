import { describe, it, expect } from 'vitest'
import { classifyPackage, classifyExternalNodes } from './infrastructureClassifier'
import type { DependencyNode } from '../graph/dependency-graph'

function makeExternalNode(name: string): DependencyNode {
  return {
    id: `external:${name}`,
    type: 'module',
    name,
    path: name,
    metadata: { isExternal: true },
  }
}

describe('classifyPackage', () => {
  describe('database packages (AC-1)', () => {
    it.each([
      'pg', 'mysql', 'mysql2', 'mongoose', 'prisma',
      'sequelize', 'typeorm', 'knex', 'mongodb', 'sqlite3',
    ])('classifies %s as database', (pkg) => {
      expect(classifyPackage(pkg)).toBe('database')
    })

    it('classifies @prisma/client as database', () => {
      expect(classifyPackage('@prisma/client')).toBe('database')
    })

    it('classifies neo4j-driver as database', () => {
      expect(classifyPackage('neo4j-driver')).toBe('database')
    })
  })

  describe('API packages (AC-2)', () => {
    it.each([
      'axios', 'node-fetch', 'got', 'superagent', 'request',
      'express', 'fastify', 'koa',
    ])('classifies %s as api', (pkg) => {
      expect(classifyPackage(pkg)).toBe('api')
    })
  })

  describe('queue packages (AC-3)', () => {
    it.each([
      'bull', 'bullmq', 'amqplib', 'kafkajs', 'bee-queue',
    ])('classifies %s as queue', (pkg) => {
      expect(classifyPackage(pkg)).toBe('queue')
    })
  })

  describe('cache packages (AC-4)', () => {
    it.each([
      'redis', 'memcached', 'ioredis', 'lru-cache', 'node-cache',
    ])('classifies %s as cache', (pkg) => {
      expect(classifyPackage(pkg)).toBe('cache')
    })
  })

  describe('filesystem packages (AC-5)', () => {
    it.each([
      'fs-extra', 'glob', 'chokidar', 'rimraf', 'globby',
    ])('classifies %s as filesystem', (pkg) => {
      expect(classifyPackage(pkg)).toBe('filesystem')
    })
  })

  describe('auth packages (AC-6)', () => {
    it.each([
      'passport', 'jsonwebtoken', 'bcrypt', 'bcryptjs', 'oauth', 'jose',
    ])('classifies %s as auth', (pkg) => {
      expect(classifyPackage(pkg)).toBe('auth')
    })
  })

  describe('logging packages (AC-7)', () => {
    it.each([
      'winston', 'pino', 'bunyan', 'morgan', 'debug',
    ])('classifies %s as logging', (pkg) => {
      expect(classifyPackage(pkg)).toBe('logging')
    })
  })

  describe('unknown packages (AC-8)', () => {
    it.each([
      'lodash', 'react', 'vue', 'moment', 'uuid', 'chalk',
    ])('classifies %s as general', (pkg) => {
      expect(classifyPackage(pkg)).toBe('general')
    })
  })

  describe('scoped packages', () => {
    it('classifies scoped package by full name', () => {
      expect(classifyPackage('@prisma/client')).toBe('database')
    })

    it('classifies scoped package by base name fallback', () => {
      // @bull-board/fastify → base name "fastify" → api
      expect(classifyPackage('@bull-board/fastify')).toBe('api')
    })

    it('classifies @hapi/hapi as api', () => {
      expect(classifyPackage('@hapi/hapi')).toBe('api')
    })

    it('classifies unknown scoped package as general', () => {
      expect(classifyPackage('@my-org/my-pkg')).toBe('general')
    })
  })

  describe('Node.js builtins', () => {
    it('classifies fs as filesystem', () => {
      expect(classifyPackage('fs')).toBe('filesystem')
    })

    it('classifies node:fs as filesystem', () => {
      expect(classifyPackage('node:fs')).toBe('filesystem')
    })

    it('classifies http as api', () => {
      expect(classifyPackage('http')).toBe('api')
    })

    it('classifies node:http as api', () => {
      expect(classifyPackage('node:http')).toBe('api')
    })

    it('classifies crypto as auth', () => {
      expect(classifyPackage('crypto')).toBe('auth')
    })

    it('classifies node:crypto as auth', () => {
      expect(classifyPackage('node:crypto')).toBe('auth')
    })

    it('classifies path as filesystem', () => {
      expect(classifyPackage('path')).toBe('filesystem')
    })

    it('classifies unrecognized builtins as general', () => {
      expect(classifyPackage('os')).toBe('general')
      expect(classifyPackage('util')).toBe('general')
    })
  })
})

describe('classifyExternalNodes', () => {
  it('classifies a mixed list of external nodes', () => {
    const nodes: DependencyNode[] = [
      makeExternalNode('express'),
      makeExternalNode('pg'),
      makeExternalNode('winston'),
      makeExternalNode('lodash'),
      makeExternalNode('redis'),
    ]

    const result = classifyExternalNodes(nodes)

    expect(result.get('external:express')).toBe('api')
    expect(result.get('external:pg')).toBe('database')
    expect(result.get('external:winston')).toBe('logging')
    expect(result.get('external:lodash')).toBe('general')
    expect(result.get('external:redis')).toBe('cache')
    expect(result.size).toBe(5)
  })

  it('returns empty map for empty input', () => {
    const result = classifyExternalNodes([])
    expect(result.size).toBe(0)
  })

  it('uses node.name for classification', () => {
    const node: DependencyNode = {
      id: 'external:jsonwebtoken',
      type: 'module',
      name: 'jsonwebtoken',
      path: 'jsonwebtoken',
      metadata: { isExternal: true },
    }

    const result = classifyExternalNodes([node])
    expect(result.get('external:jsonwebtoken')).toBe('auth')
  })

  it('falls back to id when name is empty', () => {
    const node: DependencyNode = {
      id: 'external:kafkajs',
      type: 'module',
      name: '',
      path: '',
      metadata: { isExternal: true },
    }

    const result = classifyExternalNodes([node])
    expect(result.get('external:kafkajs')).toBe('queue')
  })
})
