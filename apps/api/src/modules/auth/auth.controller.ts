import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.authService.name() };
  }
}
