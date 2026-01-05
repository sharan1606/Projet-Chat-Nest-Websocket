import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getUserRooms(req: any): Promise<import("../entities/chat-room.entity").ChatRoom[]>;
    getGeneralRoom(): Promise<import("../entities/chat-room.entity").ChatRoom>;
    joinGeneralRoom(req: any): Promise<import("../entities/chat-room.entity").ChatRoom>;
    createRoom(req: any, createRoomDto: CreateRoomDto): Promise<import("../entities/chat-room.entity").ChatRoom | null>;
    getRoomMessages(req: any, roomId: string): Promise<import("../entities/message.entity").Message[]>;
    addMembersToRoom(req: any, roomId: string, body: {
        memberIds: string[];
        hasHistoryAccess?: boolean;
    }): Promise<import("../entities/chat-room.entity").ChatRoom | null>;
}
