import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const queryRaw = jest.fn();
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  const service = new HealthService(prisma);

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports a connected database after a successful query', async () => {
    queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      db: 'connected',
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('reports a disconnected database when the query fails', async () => {
    queryRaw.mockRejectedValueOnce(new Error('connection failed'));

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      db: 'disconnected',
    });
  });
});
