import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserGuard } from '../auth/current-user.guard';
import { CurrentUserResponseDto } from './dto/current-user.dto';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Reads `request.user` directly instead of `@CurrentUser()`: this is the
   * endpoint that creates the local `User` row, so `@CurrentUser()` (which
   * requires that row to already exist) would 401 here before it ever could.
   */
  @Get('me')
  getMe(
    @Req() request: { user: AuthenticatedUser },
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.syncFromAuth0Token(request.user);
  }

  @Patch('me')
  @UseGuards(CurrentUserGuard)
  updateMe(
    @CurrentUser() currentUser: UserResponseDto,
    @Body() updateCurrentUserDto: UpdateCurrentUserDto,
  ): Promise<CurrentUserResponseDto> {
    return this.usersService.updateName(
      currentUser.id,
      updateCurrentUserDto.name,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }
}
