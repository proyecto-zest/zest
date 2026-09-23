import {
  Controller,
  Get,
  INestApplication,
  Module,
  UseGuards,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { CurrentUser } from '../src/auth/current-user.decorator';
import { CurrentUserGuard } from '../src/auth/current-user.guard';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UserResponseDto } from '../src/users/dto/user-response.dto';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  withAuthenticatedUser,
  withRejectedAuthentication,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

@Controller('current-user-test')
class CurrentUserTestController {
  @Get()
  @UseGuards(CurrentUserGuard)
  get(@CurrentUser() localUser: UserResponseDto) {
    return localUser;
  }
}

// Imports AuthModule (not the whole AppModule) so no real JwtAuthGuard ever
// gets registered as the global APP_GUARD here — this spec drives auth
// entirely through `withAuthenticatedUser`/`withRejectedAuthentication`
// (app.useGlobalGuards), which only works cleanly when it's the sole global
// guard: useGlobalGuards ADDS a guard rather than replacing one already
// registered via APP_GUARD, so a real JwtAuthGuard alongside it would run
// first and 401 every request before the fake guard gets a chance to.
@Module({
  imports: [AuthModule],
  controllers: [CurrentUserTestController],
})
class CurrentUserTestModule {}

function createTestingModule() {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(authTestConfigModuleOptions()),
      PrismaModule,
      CurrentUserTestModule,
    ],
  });
}

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('@CurrentUser() (e2e)', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('resolves the local User for an authenticated request', async () => {
    const localUser = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-test-user',
        email: 'cook@zest.test',
        name: 'Zest Cook',
        emailVerified: true,
      },
    });

    const moduleFixture = await createTestingModule().compile();
    const app: INestApplication = moduleFixture.createNestApplication();
    withAuthenticatedUser(app);
    await app.init();

    const response = await request(app.getHttpServer() as Server)
      .get('/current-user-test')
      .expect(200);

    expect(response.body).toMatchObject({ id: localUser.id });

    await app.close();
  });

  it('returns 401 when the token is valid but no local User exists yet', async () => {
    const moduleFixture = await createTestingModule().compile();
    const app: INestApplication = moduleFixture.createNestApplication();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .get('/current-user-test')
      .expect(401);

    await app.close();
  });

  it('returns 401 when the request has no valid authentication at all', async () => {
    const moduleFixture = await createTestingModule().compile();
    const app: INestApplication = moduleFixture.createNestApplication();
    withRejectedAuthentication(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .get('/current-user-test')
      .expect(401);

    await app.close();
  });
});
