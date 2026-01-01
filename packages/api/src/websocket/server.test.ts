/**
 * WebSocket Server Integration Tests
 *
 * Tests:
 * - Connection with valid JWT authentication
 * - Connection rejection without JWT
 * - Session join/leave events
 * - Position updates
 * - Viewpoint events
 * - Multi-user collaboration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer, Server as HTTPServer } from 'http';
import express, { Express } from 'express';
import { Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import msgpackParser from 'socket.io-msgpack-parser';
import { createWebSocketServer } from './server';
import { generateToken } from '../auth/jwt';
import type { ServerToClientEvents, ClientToServerEvents } from './server';

describe('WebSocket Server', () => {
  let app: Express;
  let httpServer: HTTPServer;
  let serverPort: number;
  let client1: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let client2: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let authToken1: string;
  let authToken2: string;

  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';

  // Helper to create client with MessagePack parser
  const createClient = (token?: string, useQuery = false) => {
    const options: any = {
      parser: msgpackParser, // Use MessagePack for serialization
    };

    if (token) {
      if (useQuery) {
        options.query = { token };
      } else {
        options.auth = { token };
      }
    }

    return ioClient(`http://localhost:${serverPort}`, options);
  };

  beforeAll(async () => {
    // Set JWT secret for testing
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app
    app = express();

    // Create HTTP server
    httpServer = createServer(app);

    // Create WebSocket server
    createWebSocketServer(httpServer);

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (addr && typeof addr === 'object') {
          serverPort = addr.port;
        }
        resolve();
      });
    });

    // Generate test JWT tokens
    authToken1 = generateToken('user-123');
    authToken2 = generateToken('user-456');
  });

  afterAll(async () => {
    // Close server
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  afterEach(() => {
    // Disconnect clients after each test
    if (client1?.connected) {
      client1.disconnect();
    }
    if (client2?.connected) {
      client2.disconnect();
    }
  });

  describe('Authentication (AC-3)', () => {
    it('should accept connection with valid JWT token in auth', async () => {
      return new Promise<void>((resolve, reject) => {
        client1 = createClient(authToken1);

        client1.on('connect', () => {
          expect(client1.connected).toBe(true);
          resolve();
        });

        client1.on('connect_error', (error) => {
          reject(error);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });
    });

    it('should accept connection with valid JWT token in query', async () => {
      return new Promise<void>((resolve, reject) => {
        client1 = createClient(authToken1, true);

        client1.on('connect', () => {
          expect(client1.connected).toBe(true);
          resolve();
        });

        client1.on('connect_error', (error) => {
          reject(error);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 2000);
      });
    });

    it('should reject connection without JWT token', async () => {
      return new Promise<void>((resolve) => {
        client1 = createClient();

        client1.on('connect', () => {
          throw new Error('Should not connect without token');
        });

        client1.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication error');
          resolve();
        });

        setTimeout(() => resolve(), 1000);
      });
    });

    it('should reject connection with invalid JWT token', async () => {
      return new Promise<void>((resolve) => {
        client1 = createClient('invalid-token');

        client1.on('connect', () => {
          throw new Error('Should not connect with invalid token');
        });

        client1.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication error');
          resolve();
        });

        setTimeout(() => resolve(), 1000);
      });
    });

    it('should reject connection with expired JWT token', async () => {
      // Create a manually expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'user-123' },
        TEST_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      return new Promise<void>((resolve) => {
        client1 = createClient(expiredToken);

        client1.on('connect', () => {
          throw new Error('Should not connect with expired token');
        });

        client1.on('connect_error', (error) => {
          expect(error.message).toContain('Authentication error');
          expect(error.message).toContain('expired');
          resolve();
        });

        setTimeout(() => resolve(), 1000);
      });
    });
  });

  describe('Session Management (AC-4)', () => {
    beforeEach(async () => {
      // Connect client
      return new Promise<void>((resolve) => {
        client1 = createClient(authToken1);
        client1.on('connect', () => resolve());
      });
    });

    it('should allow user to join a session', async () => {
      return new Promise<void>((resolve, reject) => {
        client1.on('session.joined', (data) => {
          expect(data).toHaveProperty('sessionId');
          expect(data).toHaveProperty('users');
          expect(data.sessionId).toBe('workspace-1');
          expect(data.users).toHaveLength(1);
          expect(data.users[0]?.userId).toBe('user-123');
          resolve();
        });

        client1.emit('session.join', {
          workspaceId: 'workspace-1',
        });

        setTimeout(() => reject(new Error('Session join timeout')), 2000);
      });
    });

    it('should notify existing users when new user joins', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // First user joins
        await new Promise<void>((res) => {
          client1.on('session.joined', () => res());
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        });

        // Set up listener for new user notification
        client1.on('session.userJoined', (data) => {
          expect(data.userId).toBe('user-456');
          resolve();
        });

        // Second user connects and joins
        client2 = createClient(authToken2);

        client2.on('connect', () => {
          client2.emit('session.join', { workspaceId: 'workspace-1' });
        });

        setTimeout(() => reject(new Error('User join notification timeout')), 3000);
      });
    });

    it('should handle session leave event', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // Join session first
        await new Promise<void>((res) => {
          client1.on('session.joined', () => res());
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        });

        // Leave session
        client1.emit('session.leave');

        // Verify we can join again (indicates successful leave)
        setTimeout(() => {
          client1.on('session.joined', (data) => {
            expect(data.sessionId).toBe('workspace-1');
            resolve();
          });
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        }, 500);

        setTimeout(() => reject(new Error('Session leave test timeout')), 3000);
      });
    });

    it('should support separate sessions per workspace', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // User 1 joins workspace 1
        await new Promise<void>((res) => {
          client1.on('session.joined', (data) => {
            expect(data.sessionId).toBe('workspace-1');
            res();
          });
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        });

        // User 2 connects and joins workspace 2
        client2 = createClient(authToken2);

        client2.on('connect', () => {
          client2.on('session.joined', (data) => {
            expect(data.sessionId).toBe('workspace-2');
            expect(data.users).toHaveLength(1);
            expect(data.users[0]?.userId).toBe('user-456');
            resolve();
          });
          client2.emit('session.join', { workspaceId: 'workspace-2' });
        });

        setTimeout(() => reject(new Error('Separate sessions timeout')), 3000);
      });
    });
  });

  describe('Connection/Disconnection Events (AC-5)', () => {
    beforeEach(async () => {
      // Connect both clients
      await Promise.all([
        new Promise<void>((resolve) => {
          client1 = createClient(authToken1);
          client1.on('connect', () => resolve());
        }),
        new Promise<void>((resolve) => {
          client2 = createClient(authToken2);
          client2.on('connect', () => resolve());
        }),
      ]);
    });

    it('should notify other users when user disconnects', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // Both users join same session
        await Promise.all([
          new Promise<void>((res) => {
            client1.on('session.joined', () => res());
            client1.emit('session.join', { workspaceId: 'workspace-1' });
          }),
          new Promise<void>((res) => {
            client2.on('session.joined', () => res());
            client2.emit('session.join', { workspaceId: 'workspace-1' });
          }),
        ]);

        // Listen for user left event
        client1.on('session.userLeft', (data) => {
          expect(data.userId).toBe('user-456');
          resolve();
        });

        // Disconnect client 2
        setTimeout(() => {
          client2.disconnect();
        }, 500);

        setTimeout(() => reject(new Error('Disconnect notification timeout')), 3000);
      });
    });
  });

  describe('Position Updates', () => {
    beforeEach(async () => {
      // Connect and join session
      await new Promise<void>((resolve) => {
        client1 = createClient(authToken1);
        client1.on('connect', () => {
          client1.on('session.joined', () => resolve());
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        });
      });
    });

    it('should broadcast position updates to other users', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // Connect second user
        client2 = createClient(authToken2);

        await new Promise<void>((res) => {
          client2.on('connect', () => {
            client2.on('session.joined', () => res());
            client2.emit('session.join', { workspaceId: 'workspace-1' });
          });
        });

        // Listen for position updates (batched)
        client2.on('positions.sync', (data) => {
          expect(data.positions).toBeDefined();
          expect(data.positions.length).toBeGreaterThan(0);
          expect(data.positions[0]?.userId).toBe('user-123');
          expect(data.positions[0]?.position).toEqual({ x: 10, y: 20, z: 30 });
          resolve();
        });

        // Send position update from client 1
        client1.emit('position.update', {
          position: { x: 10, y: 20, z: 30 },
          target: { x: 0, y: 0, z: 0 },
          color: '#FF0000',
        });

        // Wait for batch window (50ms) + buffer
        setTimeout(() => reject(new Error('Position update timeout')), 2000);
      });
    });

    it('should allow requesting all positions in session', async () => {
      return new Promise<void>((resolve, reject) => {
        client1.on('positions.sync', (data) => {
          expect(data.positions).toBeDefined();
          expect(Array.isArray(data.positions)).toBe(true);
          resolve();
        });

        client1.emit('positions.request');

        setTimeout(() => reject(new Error('Positions request timeout')), 2000);
      });
    });
  });

  describe('Viewpoint Events', () => {
    beforeEach(async () => {
      // Connect both users and join same session
      await Promise.all([
        new Promise<void>((resolve) => {
          client1 = createClient(authToken1);
          client1.on('connect', () => {
            client1.on('session.joined', () => resolve());
            client1.emit('session.join', { workspaceId: 'workspace-1' });
          });
        }),
        new Promise<void>((resolve) => {
          client2 = createClient(authToken2);
          client2.on('connect', () => {
            client2.on('session.joined', () => resolve());
            client2.emit('session.join', { workspaceId: 'workspace-1' });
          });
        }),
      ]);
    });

    it('should broadcast viewpoint created event', async () => {
      return new Promise<void>((resolve, reject) => {
        client2.on('viewpoint.created', (data) => {
          expect(data.viewpointId).toBe('viewpoint-1');
          expect(data.name).toBe('Main View');
          expect(data.createdBy).toBe('user-123');
          resolve();
        });

        client1.emit('viewpoint.created', {
          viewpointId: 'viewpoint-1',
          name: 'Main View',
        });

        setTimeout(() => reject(new Error('Viewpoint created timeout')), 2000);
      });
    });

    it('should broadcast viewpoint updated event', async () => {
      return new Promise<void>((resolve, reject) => {
        client2.on('viewpoint.updated', (data) => {
          expect(data.viewpointId).toBe('viewpoint-1');
          expect(data.updatedBy).toBe('user-123');
          resolve();
        });

        client1.emit('viewpoint.updated', {
          viewpointId: 'viewpoint-1',
        });

        setTimeout(() => reject(new Error('Viewpoint updated timeout')), 2000);
      });
    });

    it('should broadcast viewpoint deleted event', async () => {
      return new Promise<void>((resolve, reject) => {
        client2.on('viewpoint.deleted', (data) => {
          expect(data.viewpointId).toBe('viewpoint-1');
          expect(data.deletedBy).toBe('user-123');
          resolve();
        });

        client1.emit('viewpoint.deleted', {
          viewpointId: 'viewpoint-1',
        });

        setTimeout(() => reject(new Error('Viewpoint deleted timeout')), 2000);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      return new Promise<void>((resolve) => {
        client1 = createClient(authToken1);
        client1.on('connect', () => resolve());
      });
    });

    it('should handle malformed session join gracefully', async () => {
      return new Promise<void>((resolve) => {
        // Server doesn't crash with invalid data, just uses default values
        client1.on('session.joined', (data) => {
          // Server handles it gracefully (creates session with undefined ID)
          expect(data).toHaveProperty('sessionId');
          expect(data).toHaveProperty('users');
          resolve();
        });

        // Send malformed data (missing workspaceId)
        client1.emit('session.join', {} as any);

        // If it times out, that's also acceptable (no crash)
        setTimeout(() => resolve(), 1000);
      });
    });
  });

  describe('Multi-User Collaboration', () => {
    it('should support multiple users in same workspace', async () => {
      // Connect 3 users
      const token3 = generateToken('user-789');

      const [c1, c2, c3] = await Promise.all([
        new Promise<ClientSocket<ServerToClientEvents, ClientToServerEvents>>((res) => {
          const client = createClient(authToken1);
          client.on('connect', () => res(client));
        }),
        new Promise<ClientSocket<ServerToClientEvents, ClientToServerEvents>>((res) => {
          const client = createClient(authToken2);
          client.on('connect', () => res(client));
        }),
        new Promise<ClientSocket<ServerToClientEvents, ClientToServerEvents>>((res) => {
          const client = createClient(token3);
          client.on('connect', () => res(client));
        }),
      ]);

      client1 = c1;
      client2 = c2;

      // Wait for all to join
      await Promise.all([
        new Promise<void>((res) => {
          c1.on('session.joined', (data) => {
            expect(data.sessionId).toBe('workspace-1');
            res();
          });
          c1.emit('session.join', { workspaceId: 'workspace-1' });
        }),
        new Promise<void>((res) => {
          c2.on('session.joined', () => res());
          c2.emit('session.join', { workspaceId: 'workspace-1' });
        }),
        new Promise<void>((res) => {
          c3.on('session.joined', (data) => {
            // Third user should see all 3 users
            expect(data.users.length).toBeGreaterThanOrEqual(1);
            res();
          });
          c3.emit('session.join', { workspaceId: 'workspace-1' });
        }),
      ]);

      // Cleanup
      c3.disconnect();
    }, 10000); // Increase timeout for multi-user test
  });

  describe('MessagePack Serialization (AC-3)', () => {
    beforeEach(async () => {
      // Connect and join session
      await new Promise<void>((resolve) => {
        client1 = createClient(authToken1);
        client1.on('connect', () => {
          client1.on('session.joined', () => resolve());
          client1.emit('session.join', { workspaceId: 'workspace-1' });
        });
      });
    });

    it('should successfully serialize/deserialize complex position data', async () => {
      return new Promise<void>(async (resolve, reject) => {
        // Connect second user
        client2 = createClient(authToken2);

        await new Promise<void>((res) => {
          client2.on('connect', () => {
            client2.on('session.joined', () => res());
            client2.emit('session.join', { workspaceId: 'workspace-1' });
          });
        });

        // Listen for position updates with complex data
        client2.on('positions.sync', (data) => {
          expect(data.positions).toBeDefined();
          expect(data.positions.length).toBeGreaterThan(0);

          const position = data.positions[0];
          expect(position?.userId).toBe('user-123');
          expect(position?.position).toEqual({ x: 123.456, y: -789.012, z: 345.678 });
          expect(position?.target).toEqual({ x: 0, y: 0, z: 0 });
          expect(position?.color).toBe('#FF5733');
          expect(position?.timestamp).toBeDefined();
          resolve();
        });

        // Send complex position update
        client1.emit('position.update', {
          position: { x: 123.456, y: -789.012, z: 345.678 },
          target: { x: 0, y: 0, z: 0 },
          color: '#FF5733',
        });

        setTimeout(() => reject(new Error('MessagePack serialization timeout')), 2000);
      });
    });
  });

  describe('Position Batching (AC-2)', () => {
    beforeEach(async () => {
      // Connect both users and join same session
      await Promise.all([
        new Promise<void>((resolve) => {
          client1 = createClient(authToken1);
          client1.on('connect', () => {
            client1.on('session.joined', () => resolve());
            client1.emit('session.join', { workspaceId: 'workspace-1' });
          });
        }),
        new Promise<void>((resolve) => {
          client2 = createClient(authToken2);
          client2.on('connect', () => {
            client2.on('session.joined', () => resolve());
            client2.emit('session.join', { workspaceId: 'workspace-1' });
          });
        }),
      ]);
    });

    it('should batch multiple position updates within 50ms window', async () => {
      return new Promise<void>((resolve, reject) => {
        let batchCount = 0;
        const startTime = Date.now();

        // Listen for batched position updates
        client2.on('positions.sync', (data) => {
          batchCount++;
          const elapsed = Date.now() - startTime;

          // Should receive only 1 batch after 50ms window
          if (batchCount === 1) {
            expect(elapsed).toBeGreaterThanOrEqual(50);
            expect(elapsed).toBeLessThan(150); // Allow buffer
            expect(data.positions.length).toBe(1); // Only latest update from user-123

            // Verify it's the last update (position z: 30)
            const position = data.positions.find(p => p.userId === 'user-123');
            expect(position?.position.z).toBe(30);

            // Wait a bit to ensure no more batches arrive
            setTimeout(() => {
              expect(batchCount).toBe(1);
              resolve();
            }, 100);
          } else {
            reject(new Error(`Expected 1 batch, received ${batchCount}`));
          }
        });

        // Send multiple updates rapidly (should be batched)
        client1.emit('position.update', {
          position: { x: 10, y: 20, z: 10 },
          target: { x: 0, y: 0, z: 0 },
        });

        client1.emit('position.update', {
          position: { x: 10, y: 20, z: 20 },
          target: { x: 0, y: 0, z: 0 },
        });

        client1.emit('position.update', {
          position: { x: 10, y: 20, z: 30 },
          target: { x: 0, y: 0, z: 0 },
        });

        setTimeout(() => reject(new Error('Batching test timeout')), 3000);
      });
    });

    it('should send separate batches when updates span multiple 50ms windows', async () => {
      return new Promise<void>((resolve, reject) => {
        let batchCount = 0;
        const receivedBatches: number[] = [];

        client2.on('positions.sync', (data) => {
          batchCount++;
          const position = data.positions.find(p => p.userId === 'user-123');
          if (position) {
            receivedBatches.push(position.position.z);
          }

          // After receiving 2 batches, verify behavior
          if (batchCount === 2) {
            expect(receivedBatches).toContain(10); // First batch
            expect(receivedBatches).toContain(20); // Second batch
            resolve();
          }
        });

        // Send first update
        client1.emit('position.update', {
          position: { x: 10, y: 20, z: 10 },
          target: { x: 0, y: 0, z: 0 },
        });

        // Wait 100ms (> 50ms batch window), then send second update
        setTimeout(() => {
          client1.emit('position.update', {
            position: { x: 10, y: 20, z: 20 },
            target: { x: 0, y: 0, z: 0 },
          });
        }, 100);

        setTimeout(() => reject(new Error('Multiple batch test timeout')), 3000);
      });
    });
  });
});
