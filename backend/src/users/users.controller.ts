import { Controller, Get, Put, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(
    @Request() req,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }
}
