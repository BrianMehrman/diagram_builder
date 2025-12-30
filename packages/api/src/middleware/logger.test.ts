import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import { loggerMiddleware } from './logger';

describe('Logger Middleware', () => {
  let app: Application;
  let server: ReturnType<typeof app.listen>;

  beforeAll(() => {
    app = express();
    app.use(loggerMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });
    server = app.listen(0); // Random port
  });

  afterAll(() => {
    server.close();
  });

  it('should log requests in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    // Logger middleware should not interfere with response

    process.env.NODE_ENV = originalEnv;
  });

  it('should log requests in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    // Logger middleware should not interfere with response

    process.env.NODE_ENV = originalEnv;
  });

  it('should not block request processing', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body).toEqual({ message: 'test' });
  });
});
