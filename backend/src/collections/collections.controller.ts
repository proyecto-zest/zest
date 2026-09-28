import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserGuard } from '../auth/current-user.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CollectionsService } from './collections.service';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Controller('collections')
@UseGuards(CurrentUserGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(
    @CurrentUser() currentUser: UserResponseDto,
    @Body() createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionResponseDto> {
    return this.collectionsService.create(currentUser.id, createCollectionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() currentUser: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.collectionsService.remove(currentUser.id, id);
  }
}
