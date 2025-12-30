import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import { corsMiddleware } from './cors-config';

describe('CORS Configuration', () => {
  let app: Application;
  let server: ReturnType<typeof app.listen>;

  beforeAll(() => {
    app = express();
    app.use(corsMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });
    server = app.listen(0); // Random port
  });

  afterAll(() => {
    server.close();
  });

  it('should handle preflight OPTIONS request', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should include CORS headers in actual request', async () => {
    const response = await request(app)
      .get('/test')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow configured methods', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    const allowedMethods = response.headers['access-control-allow-methods'];
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');
    expect(allowedMethods).toContain('PUT');
    expect(allowedMethods).toContain('DELETE');
  });

  it('should allow configured headers', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type');

    expect(response.status).toBe(204);
    const allowedHeaders = response.headers['access-control-allow-headers'];
    expect(allowedHeaders).toContain('Authorization');
    expect(allowedHeaders).toContain('Content-Type');
  });
});
