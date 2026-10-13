import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateCollectionDto } from './create-collection.dto';

const validCollection = {
  name: 'Weeknight Dinners',
  coverImageKey: 'collections/44444444-4444-4444-8444-444444444444.webp',
  accentColor: '#e8415a',
};

describe('CreateCollectionDto', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateCollectionDto, validCollection);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a payload without a cover', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      name: validCollection.name,
      accentColor: validCollection.accentColor,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      ...validCollection,
      name: '',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it.each([
    'recipes/44444444-4444-4444-8444-444444444444.webp',
    'collections/../recipes/other.webp',
    'collections/44444444-4444-4444-8444-444444444444.gif',
    'https://images.test/cover.webp',
    '',
  ])('rejects the cover key %p', async (coverImageKey) => {
    const dto = plainToInstance(CreateCollectionDto, {
      ...validCollection,
      coverImageKey,
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects an accentColor that is not a hex color', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      ...validCollection,
      accentColor: 'not-a-color',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
