import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() createUserDto: { name: string; username: string; email: string; password: string; phone?: string }) {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  async refresh(@Body() body: { token: string }) {
    return this.authService.refresh(body.token);
  }
}