import type { DependencyNode } from '../graph/dependency-graph'

/**
 * Infrastructure type categories for external package classification.
 */
export type InfrastructureType =
  | 'database'
  | 'api'
  | 'queue'
  | 'cache'
  | 'filesystem'
  | 'auth'
  | 'logging'
  | 'general'

/**
 * Static lookup table mapping package names to infrastructure types.
 */
const PACKAGE_TYPE_MAP: Record<string, InfrastructureType> = {
  // Database
  pg: 'database',
  mysql: 'database',
  mysql2: 'database',
  mongoose: 'database',
  prisma: 'database',
  '@prisma/client': 'database',
  sequelize: 'database',
  typeorm: 'database',
  knex: 'database',
  'better-sqlite3': 'database',
  sqlite3: 'database',
  mongodb: 'database',
  neo4j: 'database',
  'neo4j-driver': 'database',
  drizzle: 'database',
  'drizzle-orm': 'database',

  // API / HTTP
  axios: 'api',
  'node-fetch': 'api',
  got: 'api',
  superagent: 'api',
  request: 'api',
  'cross-fetch': 'api',
  ky: 'api',
  undici: 'api',
  express: 'api',
  fastify: 'api',
  koa: 'api',
  hapi: 'api',
  '@hapi/hapi': 'api',
  restify: 'api',

  // Queue / Messaging
  bull: 'queue',
  bullmq: 'queue',
  amqplib: 'queue',
  kafkajs: 'queue',
  'rhea-promise': 'queue',
  'bee-queue': 'queue',
  agenda: 'queue',
  'node-cron': 'queue',

  // Cache
  redis: 'cache',
  ioredis: 'cache',
  memcached: 'cache',
  'lru-cache': 'cache',
  'node-cache': 'cache',
  keyv: 'cache',

  // Filesystem
  'fs-extra': 'filesystem',
  glob: 'filesystem',
  chokidar: 'filesystem',
  rimraf: 'filesystem',
  mkdirp: 'filesystem',
  globby: 'filesystem',

  // Auth
  passport: 'auth',
  jsonwebtoken: 'auth',
  bcrypt: 'auth',
  bcryptjs: 'auth',
  oauth: 'auth',
  'passport-jwt': 'auth',
  'passport-local': 'auth',
  jose: 'auth',

  // Logging
  winston: 'logging',
  pino: 'logging',
  bunyan: 'logging',
  morgan: 'logging',
  log4js: 'logging',
  debug: 'logging',
}

/**
 * Node.js built-in module to infrastructure type mapping.
 */
const BUILTIN_TYPE_MAP: Record<string, InfrastructureType> = {
  fs: 'filesystem',
  'fs/promises': 'filesystem',
  path: 'filesystem',
  http: 'api',
  https: 'api',
  http2: 'api',
  net: 'api',
  crypto: 'auth',
  stream: 'filesystem',
}

/**
 * Classify an external package name into an infrastructure type.
 *
 * Resolution order:
 * 1. Exact match in the package lookup table
 * 2. Scoped package base name match (e.g., `@prisma/client` → `prisma`)
 * 3. Node.js built-in module match
 * 4. Fallback to `'general'`
 *
 * @param packageName - The npm package name or Node.js built-in
 * @returns The infrastructure type
 */
export function classifyPackage(packageName: string): InfrastructureType {
  // Strip node: prefix
  const cleaned = packageName.replace(/^node:/, '')

  // 1. Exact match (handles scoped packages like @prisma/client too)
  const exact = PACKAGE_TYPE_MAP[cleaned]
  if (exact) return exact

  // 2. For scoped packages, try the base name without scope
  if (cleaned.startsWith('@')) {
    const parts = cleaned.split('/')
    const baseName = parts[1]
    if (baseName) {
      const scopedMatch = PACKAGE_TYPE_MAP[baseName]
      if (scopedMatch) return scopedMatch
    }
  }

  // 3. Node.js built-in match
  const builtinMatch = BUILTIN_TYPE_MAP[cleaned]
  if (builtinMatch) return builtinMatch

  // 4. Fallback
  return 'general'
}

/**
 * Classify all external nodes and return a map of node ID to infrastructure type.
 *
 * Designed to be called after `detectExternalImports()`. The result can be
 * injected into each node's `metadata.infrastructureType`.
 *
 * @param nodes - External DependencyNodes to classify
 * @returns Map of nodeId → InfrastructureType
 */
export function classifyExternalNodes(
  nodes: DependencyNode[],
): Map<string, InfrastructureType> {
  const result = new Map<string, InfrastructureType>()

  for (const node of nodes) {
    const packageName = node.name || node.path || node.id.replace(/^external:/, '')
    result.set(node.id, classifyPackage(packageName))
  }

  return result
}
