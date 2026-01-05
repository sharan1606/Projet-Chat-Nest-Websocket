import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<import("../entities/user.entity").User>;
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        username: string;
        email: string;
        displayColor: string;
    }>;
    getAllUsers(): Promise<import("../entities/user.entity").User[]>;
}
