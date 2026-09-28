import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerId: string,
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionResponseDto> {
    const collection = await this.prisma.collection.create({
      data: {
        ownerId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
      },
      select: {
        id: true,
        name: true,
        coverImageUrl: true,
        accentColor: true,
      },
    });

    return collection;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this collection');
    }

    // `collection_recipes` rows cascade on delete at the database level; the
    // recipes themselves are untouched — only the join rows disappear.
    await this.prisma.collection.delete({ where: { id } });
  }
}
