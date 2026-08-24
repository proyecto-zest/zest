import { envValidationSchema } from './env.validation';

describe('environment validation', () => {
  const validEnvironment = {
    CORS_ORIGIN: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://zest:zest@localhost:5432/zest',
    AUTH0_DOMAIN: 'example.us.auth0.com',
    AUTH0_AUDIENCE: 'https://api.zest.example',
    AWS_S3_BUCKET: 'zest-images-dev',
    AWS_ACCESS_KEY_ID: 'placeholder',
    AWS_SECRET_ACCESS_KEY: 'placeholder',
  };

  it('accepts all required variables', () => {
    const validation = envValidationSchema.validate(validEnvironment);

    expect(validation.error).toBeUndefined();
    expect(validation.value).toMatchObject({
      ...validEnvironment,
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('rejects a missing database URL', () => {
    const validation = envValidationSchema.validate({
      ...validEnvironment,
      DATABASE_URL: undefined,
    });

    expect(validation.error?.message).toContain('DATABASE_URL');
  });

  it('rejects an invalid CORS origin', () => {
    const validation = envValidationSchema.validate({
      ...validEnvironment,
      CORS_ORIGIN: 'localhost:5173',
    });

    expect(validation.error?.message).toContain('CORS_ORIGIN');
  });
});
