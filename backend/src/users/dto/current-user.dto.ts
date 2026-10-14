export class CurrentUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  emailVerified!: boolean;
  avatarUrl!: string | null;
}
