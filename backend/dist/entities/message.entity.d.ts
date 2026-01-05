import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';
import { Reaction } from './reaction.entity';
export declare class Message {
    id: string;
    content: string;
    user: User;
    chatRoom: ChatRoom;
    chatRoomId: string;
    createdAt: Date;
    reactions: Reaction[];
}
