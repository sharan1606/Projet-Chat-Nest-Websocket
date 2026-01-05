import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('reactions')
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  emoji: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Message, (message) => message.reactions)
  message: Message;

  @Column()
  messageId: string;

  @CreateDateColumn()
  createdAt: Date;
}
