import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Fetch user with roles
    const userWithRoles = await this.usersService.findByIdWithRoles(user.id);
    const roles = userWithRoles?.roles.map((ur) => ur.role.name) || [];
    
    const payload = { 
      username: user.username, 
      sub: user.id,
      roles: roles,
      isAdmin: user.isAdmin || false
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        roles: roles,
        isAdmin: user.isAdmin || false
      }
    };
  }

  async register(createUserDto: { name: string; username: string; email: string; password: string; phone?: string }) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const { password, ...result } = user;
    return result;
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token, { ignoreExpiration: true });
      const user = await this.usersService.findByIdWithRoles(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      const roles = user.roles.map((ur) => ur.role.name) || [];
      const newPayload = { 
        username: user.username, 
        sub: user.id,
        roles: roles,
        isAdmin: user.isAdmin || false
      };
      return {
        access_token: this.jwtService.sign(newPayload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          roles: roles,
          isAdmin: user.isAdmin || false
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}