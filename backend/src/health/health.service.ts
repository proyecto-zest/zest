import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export type HealthStatus = {
  status: 'ok';
  db: 'connected' | 'disconnected';
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return { status: 'ok', db: 'connected' };
    } catch {
      return { status: 'ok', db: 'disconnected' };
    }
  }
}
