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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserGuard } from '../auth/current-user.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  RecipeImageUploadRequestDto,
  RecipeImageUploadResponseDto,
} from './dto/recipe-image-upload.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('metadata')
  getMetadata(): RecipeMetadataResponseDto {
    return this.recipesService.getMetadata();
  }

  @Get()
  findAll(
    @Query() query: ListRecipesQueryDto,
  ): Promise<PaginatedRecipesResponseDto> {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RecipeDetailResponseDto> {
    return this.recipesService.findOne(id);
  }

  @Post('image-upload-url')
  createImageUploadUrl(
    @Body() requestDto: RecipeImageUploadRequestDto,
  ): Promise<RecipeImageUploadResponseDto> {
    return this.recipesService.createImageUploadUrl(requestDto);
  }

  @Post()
  @UseGuards(CurrentUserGuard)
  create(
    @CurrentUser() currentUser: UserResponseDto,
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
    return this.recipesService.create(currentUser.id, createRecipeDto);
  }

  @Put(':id')
  @UseGuards(CurrentUserGuard)
  update(
    @CurrentUser() currentUser: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ): Promise<RecipeDetailResponseDto> {
    return this.recipesService.update(currentUser.id, id, updateRecipeDto);
  }

  @Delete(':id')
  @UseGuards(CurrentUserGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() currentUser: UserResponseDto,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.recipesService.remove(currentUser.id, id);
  }
}
