export const AUTH0_CLAIMS_NAMESPACE = 'https://zest.app';

export const AUTH0_EMAIL_CLAIM = `${AUTH0_CLAIMS_NAMESPACE}/email` as const;
export const AUTH0_NAME_CLAIM = `${AUTH0_CLAIMS_NAMESPACE}/name` as const;
export const AUTH0_PICTURE_CLAIM = `${AUTH0_CLAIMS_NAMESPACE}/picture` as const;
export const AUTH0_EMAIL_VERIFIED_CLAIM =
  `${AUTH0_CLAIMS_NAMESPACE}/email_verified` as const;
