import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('chat_room_members')
export class ChatRoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.memberSettings)
  chatRoom: ChatRoom;

  @Column()
  chatRoomId: string;

  @Column({ default: true })
  hasHistoryAccess: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}
