import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { PlannerEntriesController } from './planner-entries.controller';
import { PlannerEntriesService } from './planner-entries.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [PlannerEntriesController],
  providers: [PlannerEntriesService],
})
export class PlannerEntriesModule {}
