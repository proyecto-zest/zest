import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { configureApp } from './configure-app';

describe('configureApp', () => {
  it('applies the shared CORS and validation configuration', () => {
    const enableCors = jest.fn();
    const useGlobalPipes = jest.fn();
    const get = jest.fn().mockReturnValue({
      getOrThrow: jest.fn().mockReturnValue('http://localhost:5173'),
    });
    const app = {
      enableCors,
      useGlobalPipes,
      get,
    } as unknown as INestApplication;

    configureApp(app);

    expect(get).toHaveBeenCalledWith(ConfigService);
    expect(enableCors).toHaveBeenCalledWith({
      origin: 'http://localhost:5173',
    });
    expect(useGlobalPipes).toHaveBeenCalledTimes(1);
  });
});
