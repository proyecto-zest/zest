import * as Joi from 'joi';

import { isValidCorsOrigin, parseCorsOrigins } from '../cors-origins';

export type EnvironmentVariables = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  AWS_S3_BUCKET: string;
  AWS_S3_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
};

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string()
    .custom((value: string, helpers) => {
      const origins = parseCorsOrigins(value);

      return origins.length > 0 && origins.every(isValidCorsOrigin)
        ? value
        : helpers.error('any.invalid');
    })
    .required(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  AUTH0_DOMAIN: Joi.string().hostname().required(),
  AUTH0_AUDIENCE: Joi.string().uri().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
});
