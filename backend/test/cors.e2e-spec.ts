import { Controller, Get, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { configureApp } from '../src/configure-app';

const PRODUCTION = 'https://zest-frontend-five.vercel.app';
const PREVIEW = 'https://zest-frontend-git-login-zest20.vercel.app';

@Controller('ping')
class PingController {
  @Get()
  ping(): { ok: boolean } {
    return { ok: true };
  }
}

describe('CORS (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              CORS_ORIGIN: `${PRODUCTION},https://zest-frontend-*-zest20.vercel.app`,
            }),
          ],
        }),
      ],
      controllers: [PingController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const preflight = (origin: string) =>
    request(app.getHttpServer() as Server)
      .options('/ping')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

  it.each([PRODUCTION, PREVIEW])(
    'answers the preflight for %s with Authorization and Content-Type allowed',
    async (origin) => {
      const response = await preflight(origin).expect(204);

      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-headers']).toBe(
        'Content-Type,Authorization',
      );
      expect(response.headers.vary).toContain('Origin');
    },
  );

  it.each([
    'https://example.com',
    'https://zest-frontend-x.evil.com-zest20.vercel.app',
    'https://zest-frontend-x-other.vercel.app',
  ])('does not allow %s in the preflight', async (origin) => {
    const response = await preflight(origin);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('adds the allow-origin header to a real request from a preview', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/ping')
      .set('Origin', PREVIEW)
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(PREVIEW);
  });
});
