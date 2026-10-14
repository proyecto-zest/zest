import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [StorageModule, AuthModule],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
