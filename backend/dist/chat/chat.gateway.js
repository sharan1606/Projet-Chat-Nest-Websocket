"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    chatService;
    jwtService;
    server;
    connectedUsers = new Map();
    typingUsers = new Map();
    constructor(chatService, jwtService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            });
            this.connectedUsers.set(client.id, {
                socketId: client.id,
                userId: payload.sub,
                username: payload.username,
            });
            client.data.userId = payload.sub;
            client.data.username = payload.username;
            console.log(`Client connected: ${client.id} (User: ${payload.username})`);
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            this.typingUsers.forEach((users, roomId) => {
                if (users.has(user.userId)) {
                    users.delete(user.userId);
                    this.server.to(roomId).emit('userStoppedTyping', {
                        userId: user.userId,
                        username: user.username,
                    });
                }
            });
            this.connectedUsers.delete(client.id);
            console.log(`Client disconnected: ${client.id} (User: ${user.username})`);
        }
    }
    async handleJoinRoom(client, data) {
        const { roomId } = data;
        await client.join(roomId);
        console.log(`User ${client.data.username} joined room ${roomId}`);
        return { success: true };
    }
    async handleLeaveRoom(client, data) {
        const { roomId } = data;
        await client.leave(roomId);
        const typingSet = this.typingUsers.get(roomId);
        if (typingSet && typingSet.has(client.data.userId)) {
            typingSet.delete(client.data.userId);
            this.server.to(roomId).emit('userStoppedTyping', {
                userId: client.data.userId,
                username: client.data.username,
            });
        }
        console.log(`User ${client.data.username} left room ${roomId}`);
        return { success: true };
    }
    async handleMessage(client, data) {
        try {
            const message = await this.chatService.createMessage(client.data.userId, data.roomId, data.content);
            const typingSet = this.typingUsers.get(data.roomId);
            if (typingSet && typingSet.has(client.data.userId)) {
                typingSet.delete(client.data.userId);
                this.server.to(data.roomId).emit('userStoppedTyping', {
                    userId: client.data.userId,
                    username: client.data.username,
                });
            }
            this.server.to(data.roomId).emit('newMessage', message);
            return { success: true, message };
        }
        catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }
    handleTyping(client, data) {
        const { roomId, isTyping } = data;
        if (!this.typingUsers.has(roomId)) {
            this.typingUsers.set(roomId, new Set());
        }
        const typingSet = this.typingUsers.get(roomId);
        if (isTyping) {
            if (typingSet) {
                typingSet.add(client.data.userId);
            }
            this.server.to(roomId).emit('userTyping', {
                userId: client.data.userId,
                username: client.data.username,
            });
        }
        else {
            if (typingSet) {
                typingSet.delete(client.data.userId);
            }
            this.server.to(roomId).emit('userStoppedTyping', {
                userId: client.data.userId,
                username: client.data.username,
            });
        }
        const typingUsersList = typingSet ? Array.from(typingSet).map(userId => {
            const userSocket = Array.from(this.connectedUsers.values()).find(u => u.userId === userId);
            return {
                userId,
                username: userSocket?.username,
            };
        }) : [];
        this.server.to(roomId).emit('typingUsers', typingUsersList);
        return { success: true };
    }
    async handleAddReaction(client, data) {
        try {
            const reaction = await this.chatService.addReaction(client.data.userId, data.messageId, data.emoji);
            this.server.to(data.roomId).emit('reactionAdded', {
                messageId: data.messageId,
                reaction,
            });
            return { success: true, reaction };
        }
        catch (error) {
            console.error('Error adding reaction:', error);
            return { success: false, error: error.message };
        }
    }
    async handleRemoveReaction(client, data) {
        try {
            await this.chatService.removeReaction(data.reactionId, client.data.userId);
            this.server.to(data.roomId).emit('reactionRemoved', {
                messageId: data.messageId,
                reactionId: data.reactionId,
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error removing reaction:', error);
            return { success: false, error: error.message };
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('addReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleAddReaction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRemoveReaction", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map