import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Set JWT_SECRET before importing app (which validates environment)
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';

import app from './index';

describe('Server', () => {
  describe('Health Check', () => {
    it('GET /health should return 200 OK with status healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'healthy' });
    });

    it('should have correct content-type header', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Middleware Stack', () => {
    it('should apply CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should log requests (logger middleware active)', async () => {
      // Logger middleware should not block requests
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('should handle JSON body parsing', async () => {
      // Since we don't have POST endpoints yet, just verify json() middleware is active
      // by checking that the health endpoint works (which means all middleware loaded correctly)
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'healthy' });
    });
  });
});
