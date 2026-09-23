import { UserResponseDto } from './dto/user-response.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
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
