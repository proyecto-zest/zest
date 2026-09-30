import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateCollectionDto } from './create-collection.dto';

const validCollection = {
  name: 'Weeknight Dinners',
  coverImageUrl: 'https://images.test/cover.webp',
  accentColor: '#e8415a',
};

describe('CreateCollectionDto', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateCollectionDto, validCollection);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      ...validCollection,
      name: '',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects an empty coverImageUrl', async () => {
    const dto = plainToInstance(CreateCollectionDto, {
      ...validCollection,
      coverImageUrl: '',
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
