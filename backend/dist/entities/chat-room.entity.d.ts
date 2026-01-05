import { User } from './user.entity';
import { Message } from './message.entity';
import { ChatRoomMember } from './chat-room-member.entity';
export declare class ChatRoom {
    id: string;
    name: string;
    isGeneral: boolean;
    creatorId: string;
    createdAt: Date;
    members: User[];
    messages: Message[];
    memberSettings: ChatRoomMember[];
}
