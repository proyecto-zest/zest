import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [StorageModule],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
