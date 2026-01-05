import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChatService } from '../chat/chat.service';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private chatService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, chatService: ChatService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            displayColor: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            displayColor: string;
        };
    }>;
}
