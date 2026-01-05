import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findOne(userId);

    if (updateProfileDto.username) {
      user.username = updateProfileDto.username;
    }

    if (updateProfileDto.displayColor) {
      user.displayColor = updateProfileDto.displayColor;
    }

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayColor: user.displayColor,
    };
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'displayColor'],
    });
  }
}
