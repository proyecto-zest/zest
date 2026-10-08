import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserGuard } from '../auth/current-user.guard';
import { RecipeImageUploadRequestDto } from '../recipes/dto/recipe-image-upload.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CollectionsService } from './collections.service';
import { CollectionCoverUploadResponseDto } from './dto/collection-cover-upload.dto';
import {
  CollectionDetailResponseDto,
  CollectionListItemResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { ListCollectionsQueryDto } from './dto/list-collections-query.dto';

@Controller('collections')
@UseGuards(CurrentUserGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: UserResponseDto,
    @Query() query: ListCollectionsQueryDto,
  ): Promise<CollectionListItemResponseDto[]> {
    return this.collectionsService.findAll(currentUser.id, query.recipeId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollectionDetailResponseDto> {
    return this.collectionsService.findOne(currentUser.id, id);
  }

  @Post('cover-upload-url')
  createCoverUploadUrl(
    @Body() requestDto: RecipeImageUploadRequestDto,
  ): Promise<CollectionCoverUploadResponseDto> {
    return this.collectionsService.createCoverUploadUrl(requestDto);
  }

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
