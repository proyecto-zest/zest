import { generateKeyPairSync, KeyObject } from 'node:crypto';
import { sign } from 'jsonwebtoken';

import {
  AUTH0_EMAIL_CLAIM,
  AUTH0_EMAIL_VERIFIED_CLAIM,
  AUTH0_NAME_CLAIM,
  AUTH0_PICTURE_CLAIM,
} from '../src/auth/auth.constants';

export const TEST_AUTH0_DOMAIN = 'auth-test.example.com';
export const TEST_AUTH0_AUDIENCE = 'https://api.zest.test';
export const TEST_AUTH0_ISSUER = `https://${TEST_AUTH0_DOMAIN}/`;

let signingKeyPair: { privateKey: KeyObject; publicKeyPem: string } | null =
  null;

function getSigningKeyPair(): {
  privateKey: KeyObject;
  publicKeyPem: string;
} {
  if (!signingKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    signingKeyPair = {
      privateKey,
      publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }) as string,
    };
  }

  return signingKeyPair;
}

/**
 * `jwks-rsa`'s `passportJwtSecret`, faked to resolve the key pair above
 * instead of calling out to Auth0.
 *
 * Jest hoists `jest.mock(...)` above every `import` in the file, so the
 * factory can't close over an imported reference to this function (that
 * throws "Cannot access '...' before initialization"). Every e2e spec that
 * loads the auth module must instead load it lazily inside the factory via
 * `jest.requireActual`, as the very first statement in the file, before any
 * `import`:
 *
 *   jest.mock('jwks-rsa', () =>
 *     jest
 *       .requireActual<typeof import('./auth-test-helper')>('./auth-test-helper')
 *       .mockJwksModule(),
 *   );
 */
export function mockJwksModule(): {
  passportJwtSecret: () => JwksSecretProvider;
} {
  return {
    passportJwtSecret:
      (): JwksSecretProvider =>
      (
        _request: unknown,
        _rawJwtToken: string,
        done: (error: Error | null, secret?: string) => void,
      ) =>
        done(null, getSigningKeyPair().publicKeyPem),
  };
}

type JwksSecretProvider = (
  request: unknown,
  rawJwtToken: string,
  done: (error: Error | null, secret?: string) => void,
) => void;

/** `ConfigModule.forRoot#load` factory wiring the strategy to the mocked JWKS above. */
export function testAuthConfig(): Record<string, string> {
  return {
    AUTH0_AUDIENCE: TEST_AUTH0_AUDIENCE,
    AUTH0_DOMAIN: TEST_AUTH0_DOMAIN,
  };
}

export type TestTokenClaims = {
  subject?: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  audience?: string;
  issuer?: string;
  expiresIn?: number;
};

/**
 * Signs a JWT shaped like a real Auth0 token, against the key `mockJwks()`
 * exposes. Defaults its `audience`/`issuer` to `TEST_AUTH0_AUDIENCE`/
 * `TEST_AUTH0_ISSUER` — pair this with `authTestConfigModuleOptions()` (an
 * isolated `ConfigModule` pointed at those same values) when wiring up the
 * module under test.
 */
export function createTestToken(claims?: TestTokenClaims): string {
  const { privateKey } = getSigningKeyPair();

  return sign(
    {
      [AUTH0_EMAIL_CLAIM]: claims?.email ?? 'cook@zest.test',
      [AUTH0_NAME_CLAIM]: claims?.name ?? 'Zest Cook',
      [AUTH0_PICTURE_CLAIM]: claims?.picture ?? 'https://images.test/cook.webp',
      [AUTH0_EMAIL_VERIFIED_CLAIM]: claims?.emailVerified ?? true,
    },
    privateKey,
    {
      algorithm: 'RS256',
      audience: claims?.audience ?? TEST_AUTH0_AUDIENCE,
      expiresIn: claims?.expiresIn ?? 300,
      issuer: claims?.issuer ?? TEST_AUTH0_ISSUER,
      subject: claims?.subject ?? 'auth0|zest-user',
    },
  );
}

export function authTestConfigModuleOptions() {
  return {
    ignoreEnvFile: true,
    isGlobal: true,
    load: [testAuthConfig],
  };
}
