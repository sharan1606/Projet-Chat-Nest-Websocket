import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, { socketId: string; userId: string; username: string }> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
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
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
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

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    await client.join(roomId);
    
    console.log(`User ${client.data.username} joined room ${roomId}`);
    
    return { success: true };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
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

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    try {
      const message = await this.chatService.createMessage(
        client.data.userId,
        data.roomId,
        data.content,
      );

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
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
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
    } else {
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

  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string; roomId: string },
  ) {
    try {
      const reaction = await this.chatService.addReaction(
        client.data.userId,
        data.messageId,
        data.emoji,
      );

      this.server.to(data.roomId).emit('reactionAdded', {
        messageId: data.messageId,
        reaction,
      });

      return { success: true, reaction };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { reactionId: string; roomId: string; messageId: string },
  ) {
    try {
      await this.chatService.removeReaction(data.reactionId, client.data.userId);

      this.server.to(data.roomId).emit('reactionRemoved', {
        messageId: data.messageId,
        reactionId: data.reactionId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }
  }
}
