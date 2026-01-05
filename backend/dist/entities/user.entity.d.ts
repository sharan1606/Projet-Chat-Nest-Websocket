import { ChatRoom } from './chat-room.entity';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    displayColor: string;
    createdAt: Date;
    updatedAt: Date;
    chatRooms: ChatRoom[];
}
