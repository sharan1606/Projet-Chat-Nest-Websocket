import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private jwtService;
    server: Server;
    private connectedUsers;
    private typingUsers;
    constructor(chatService: ChatService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, data: {
        roomId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleLeaveRoom(client: Socket, data: {
        roomId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleMessage(client: Socket, data: {
        roomId: string;
        content: string;
    }): Promise<{
        success: boolean;
        message: import("../entities/message.entity").Message | null;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleTyping(client: Socket, data: {
        roomId: string;
        isTyping: boolean;
    }): {
        success: boolean;
    };
    handleAddReaction(client: Socket, data: {
        messageId: string;
        emoji: string;
        roomId: string;
    }): Promise<{
        success: boolean;
        reaction: import("../entities/reaction.entity").Reaction;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        reaction?: undefined;
    }>;
    handleRemoveReaction(client: Socket, data: {
        reactionId: string;
        roomId: string;
        messageId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
