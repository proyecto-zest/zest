import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUserResponseDto } from './dto/current-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  it('delegates GET /users/me to syncFromAuth0Token', async () => {
    const authenticatedUser: AuthenticatedUser = { sub: 'auth0|zest-user' };
    const currentUser = { id: 'user-id' } as CurrentUserResponseDto;
    const syncFromAuth0Token = jest.fn().mockResolvedValue(currentUser);
    const controller = new UsersController({
      syncFromAuth0Token,
    } as unknown as UsersService);

    await expect(controller.getMe({ user: authenticatedUser })).resolves.toBe(
      currentUser,
    );
    expect(syncFromAuth0Token).toHaveBeenCalledWith(authenticatedUser);
  });

  it('delegates PATCH /users/me to updateName with the resolved current user id', async () => {
    const currentUser = { id: 'user-id' } as UserResponseDto;
    const updated = {
      id: 'user-id',
      name: 'Nuevo Nombre',
    } as CurrentUserResponseDto;
    const updateName = jest.fn().mockResolvedValue(updated);
    const controller = new UsersController({
      updateName,
    } as unknown as UsersService);

    await expect(
      controller.updateMe(currentUser, { name: 'Nuevo Nombre' }),
    ).resolves.toBe(updated);
    expect(updateName).toHaveBeenCalledWith('user-id', 'Nuevo Nombre');
  });

  it('delegates user retrieval to the service', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const user: UserResponseDto = {
      id: userId,
      name: 'Carla Cocinera',
      avatarUrl: 'https://images.test/carla.webp',
    };
    const findOne = jest.fn().mockResolvedValue(user);
    const controller = new UsersController({
      findOne,
    } as unknown as UsersService);

    await expect(controller.findOne(userId)).resolves.toBe(user);
    expect(findOne).toHaveBeenCalledWith(userId);
  });
});
