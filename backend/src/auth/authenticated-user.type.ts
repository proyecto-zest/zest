export type AuthenticatedUser = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
};
