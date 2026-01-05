import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { User } from './entities/user.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { Reaction } from './entities/reaction.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'chat.db',
      entities: [User, ChatRoom, Message, Reaction, ChatRoomMember],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
