import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { ChatRoomMember } from '../entities/chat-room-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User, Reaction, ChatRoomMember]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
