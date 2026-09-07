import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  RECIPE_IMAGE_CONTENT_TYPES,
  RecipeImageUploadRequestDto,
} from './recipe-image-upload.dto';

describe('RecipeImageUploadRequestDto', () => {
  it.each(RECIPE_IMAGE_CONTENT_TYPES)('accepts %s', async (contentType) => {
    const dto = plainToInstance(RecipeImageUploadRequestDto, { contentType });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a content type outside the image allowlist', async () => {
    const dto = plainToInstance(RecipeImageUploadRequestDto, {
      contentType: 'application/pdf',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
