import { User } from './user.entity';
import { Message } from './message.entity';
export declare class Reaction {
    id: string;
    emoji: string;
    user: User;
    message: Message;
    messageId: string;
    createdAt: Date;
}
