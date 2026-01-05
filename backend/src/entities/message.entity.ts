import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';
import { Reaction } from './reaction.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  chatRoom: ChatRoom;

  @Column()
  chatRoomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];
}
