import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';
export declare class ChatRoomMember {
    id: string;
    user: User;
    userId: string;
    chatRoom: ChatRoom;
    chatRoomId: string;
    hasHistoryAccess: boolean;
    joinedAt: Date;
}
