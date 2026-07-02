import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService, MeResponse } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { OrganizationGuard } from './guards/organization.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './types/authenticated-user';

// Note: there is intentionally no POST /auth/login endpoint. Authentication
// happens client-side via supabase-js; this API only ever validates the
// resulting Supabase JWT (see SupabaseAuthGuard).
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.authService.getMe(user);
  }
}
