import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';
import { ChatRoomMember } from './chat-room-member.entity';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  isGeneral: boolean;

  @Column({ nullable: true })
  creatorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.chatRooms)
  @JoinTable({
    name: 'chat_room_users',
    joinColumn: { name: 'chat_room_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @OneToMany(() => Message, (message) => message.chatRoom)
  messages: Message[];

  @OneToMany(() => ChatRoomMember, (member) => member.chatRoom)
  memberSettings: ChatRoomMember[];
}
