import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateCurrentUserDto } from './update-current-user.dto';

describe('UpdateCurrentUserDto', () => {
  it('accepts a valid name', async () => {
    const dto = plainToInstance(UpdateCurrentUserDto, { name: 'Carla' });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('trims surrounding whitespace', () => {
    const dto = plainToInstance(UpdateCurrentUserDto, { name: '  Carla  ' });

    expect(dto.name).toBe('Carla');
  });

  it('rejects an empty name', async () => {
    const errors = await validate(
      plainToInstance(UpdateCurrentUserDto, { name: '' }),
    );

    expect(errors).not.toHaveLength(0);
  });

  it('rejects a name that is only whitespace', async () => {
    const errors = await validate(
      plainToInstance(UpdateCurrentUserDto, { name: '   ' }),
    );

    expect(errors).not.toHaveLength(0);
  });

  it('rejects a name longer than 100 characters', async () => {
    const errors = await validate(
      plainToInstance(UpdateCurrentUserDto, { name: 'a'.repeat(101) }),
    );

    expect(errors).not.toHaveLength(0);
  });

  it('accepts a name exactly 100 characters long', async () => {
    const errors = await validate(
      plainToInstance(UpdateCurrentUserDto, { name: 'a'.repeat(100) }),
    );

    expect(errors).toHaveLength(0);
  });
});
