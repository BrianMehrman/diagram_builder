import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import { authRouter } from './auth';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';

describe('Authentication Routes', () => {
  let app: Express;
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use(errorHandler);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST /api/auth/login', () => {
    it('should return token and expiresIn for valid userId', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user-123' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.expiresIn).toBe(24 * 60 * 60); // 24 hours in seconds
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body.type).toContain('validation-error');
    });

    it('should return 400 when userId is not a string', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ userId: 12345 })
        .expect(400);

      expect(response.body.type).toContain('validation-error');
    });

    it('should generate valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user-456' })
        .expect(200);

      const token = response.body.token;
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new token for valid authentication', async () => {
      const userId = 'user-refresh';
      const token = generateToken(userId);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3); // Valid JWT format
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('status', 401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign({ userId: 'user-expired' }, TEST_SECRET, { expiresIn: '-1s' });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.type).toContain('unauthorized');
    });
  });
});
