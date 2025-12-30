/**
 * Vitest global setup
 * Sets environment variables before tests run
 */

// Set JWT_SECRET for all tests
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';

// Set Neo4j configuration for all tests
process.env.NEO4J_URI = 'bolt://localhost:7687';
process.env.NEO4J_USERNAME = 'neo4j';
process.env.NEO4J_PASSWORD = 'test-password';
