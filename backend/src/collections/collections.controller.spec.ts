import { UserResponseDto } from '../users/dto/user-response.dto';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import {
  CollectionDetailResponseDto,
  CollectionListItemResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { ListCollectionsQueryDto } from './dto/list-collections-query.dto';

describe('CollectionsController', () => {
  const currentUser: UserResponseDto = {
    id: 'user-id',
    name: 'Zest Cook',
    avatarUrl: null,
  };

  it('delegates collection creation to the service with the current user id', async () => {
    const createCollectionDto: CreateCollectionDto = {
      name: 'Weeknight Dinners',
      coverImageUrl: 'https://images.test/cover.webp',
      accentColor: '#e8415a',
    };
    const created: CollectionResponseDto = {
      id: 'collection-id',
      ...createCollectionDto,
    };
    const create = jest.fn().mockResolvedValue(created);
    const controller = new CollectionsController({
      create,
    } as unknown as CollectionsService);

    await expect(
      controller.create(currentUser, createCollectionDto),
    ).resolves.toBe(created);
    expect(create).toHaveBeenCalledWith('user-id', createCollectionDto);
  });

  it('delegates collection deletion to the service with the current user id', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const controller = new CollectionsController({
      remove,
    } as unknown as CollectionsService);

    await controller.remove(currentUser, 'collection-id');

    expect(remove).toHaveBeenCalledWith('user-id', 'collection-id');
  });

  it('delegates collection listing to the service with the current user id and recipeId', async () => {
    const query: ListCollectionsQueryDto = { recipeId: 'recipe-id' };
    const result: CollectionListItemResponseDto[] = [];
    const findAll = jest.fn().mockResolvedValue(result);
    const controller = new CollectionsController({
      findAll,
    } as unknown as CollectionsService);

    await expect(controller.findAll(currentUser, query)).resolves.toBe(result);
    expect(findAll).toHaveBeenCalledWith('user-id', 'recipe-id');
  });

  it('delegates collection detail retrieval to the service', async () => {
    const result = {
      id: 'collection-id',
      recipes: [],
    } as unknown as CollectionDetailResponseDto;
    const findOne = jest.fn().mockResolvedValue(result);
    const controller = new CollectionsController({
      findOne,
    } as unknown as CollectionsService);

    await expect(
      controller.findOne(currentUser, 'collection-id'),
    ).resolves.toBe(result);
    expect(findOne).toHaveBeenCalledWith('user-id', 'collection-id');
  });
});
