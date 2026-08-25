import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const service = new PrismaService();

  it('connects when its module initializes', async () => {
    const connect = jest
      .spyOn(service, '$connect')
      .mockResolvedValueOnce(undefined);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects when its module is destroyed', async () => {
    const disconnect = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValueOnce(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
