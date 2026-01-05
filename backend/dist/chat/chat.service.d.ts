import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { ChatRoomMember } from '../entities/chat-room-member.entity';
import { CreateRoomDto } from './dto/create-room.dto';
export declare class ChatService {
    private chatRoomRepository;
    private messageRepository;
    private userRepository;
    private reactionRepository;
    private chatRoomMemberRepository;
    constructor(chatRoomRepository: Repository<ChatRoom>, messageRepository: Repository<Message>, userRepository: Repository<User>, reactionRepository: Repository<Reaction>, chatRoomMemberRepository: Repository<ChatRoomMember>);
    createMessage(userId: string, roomId: string, content: string): Promise<Message | null>;
    getRoomMessages(roomId: string, userId: string): Promise<Message[]>;
    createRoom(createRoomDto: CreateRoomDto, creatorId: string): Promise<ChatRoom | null>;
    getUserRooms(userId: string): Promise<ChatRoom[]>;
    getGeneralRoom(): Promise<ChatRoom>;
    joinGeneralRoom(userId: string): Promise<ChatRoom>;
    addReaction(userId: string, messageId: string, emoji: string): Promise<Reaction>;
    removeReaction(reactionId: string, userId: string): Promise<void>;
    addMembersToRoom(roomId: string, userId: string, memberIds: string[], hasHistoryAccess?: boolean): Promise<ChatRoom | null>;
}
