import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { CurrentUserGuard } from './current-user.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), UsersModule],
  providers: [JwtStrategy, CurrentUserGuard],
  // UsersModule is re-exported (not just imported) because `@UseGuards(CurrentUserGuard)`
  // passes the class itself, not the already-instantiated singleton — Nest
  // resolves it fresh in whichever module's controller uses it, so that
  // module needs CurrentUserGuard's own dependency (UsersService) reachable
  // too, not just CurrentUserGuard.
  exports: [PassportModule, CurrentUserGuard, UsersModule],
})
export class AuthModule {}
