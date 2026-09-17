import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  it('returns the health service result', async () => {
    const result = { status: 'ok', db: 'connected' } as const;
    const healthService = {
      check: jest.fn().mockResolvedValue(result),
    } as unknown as HealthService;
    const controller = new HealthController(healthService);

    await expect(controller.check()).resolves.toEqual(result);
  });
});
