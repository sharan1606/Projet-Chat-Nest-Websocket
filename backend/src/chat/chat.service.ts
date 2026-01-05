import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { ChatRoomMember } from '../entities/chat-room-member.entity';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
    @InjectRepository(ChatRoomMember)
    private chatRoomMemberRepository: Repository<ChatRoomMember>,
  ) {}

  async createMessage(userId: string, roomId: string, content: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const room = await this.chatRoomRepository.findOne({ 
      where: { id: roomId },
      relations: ['members'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const isMember = room.members.some(member => member.id === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat room');
    }

    const message = this.messageRepository.create({
      content,
      user,
      chatRoom: room,
      chatRoomId: roomId,
    });

    const savedMessage = await this.messageRepository.save(message);
    
    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['user', 'reactions', 'reactions.user'],
    });
  }

  async getRoomMessages(roomId: string, userId: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['members', 'memberSettings'],
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const isMember = room.members.some(member => member.id === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this chat room');
    }

    const memberSettings = room.memberSettings.find(ms => ms.userId === userId);
    
    if (memberSettings && !memberSettings.hasHistoryAccess) {
      return this.messageRepository.find({
        where: { chatRoomId: roomId },
        relations: ['user', 'reactions', 'reactions.user'],
        order: { createdAt: 'ASC' },
      }).then(messages => 
        messages.filter(msg => new Date(msg.createdAt) >= new Date(memberSettings.joinedAt))
      );
    }

    return this.messageRepository.find({
      where: { chatRoomId: roomId },
      relations: ['user', 'reactions', 'reactions.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async createRoom(createRoomDto: CreateRoomDto, creatorId: string) {
    const { name, memberIds, hasHistoryAccess } = createRoomDto;

    const allMemberIds = [...new Set([creatorId, ...memberIds])];
    const users = await this.userRepository.find({
      where: { id: In(allMemberIds) },
    });

    if (users.length !== allMemberIds.length) {
      throw new NotFoundException('Some users not found');
    }

    const room = this.chatRoomRepository.create({
      name,
      members: users,
      creatorId,
    });

    const savedRoom = await this.chatRoomRepository.save(room);

    for (const userId of memberIds) {
      if (userId !== creatorId) {
        const memberSetting = this.chatRoomMemberRepository.create({
          userId,
          chatRoomId: savedRoom.id,
          hasHistoryAccess: hasHistoryAccess ?? true,
        });
        await this.chatRoomMemberRepository.save(memberSetting);
      } else {
        const memberSetting = this.chatRoomMemberRepository.create({
          userId,
          chatRoomId: savedRoom.id,
          hasHistoryAccess: true,
        });
        await this.chatRoomMemberRepository.save(memberSetting);
      }
    }

    return this.chatRoomRepository.findOne({
      where: { id: savedRoom.id },
      relations: ['members', 'memberSettings'],
    });
  }

  async getUserRooms(userId: string) {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.members', 'member')
      .leftJoinAndSelect('room.messages', 'message')
      .where('member.id = :userId', { userId })
      .orderBy('room.createdAt', 'DESC')
      .getMany();

    const generalChatRooms = rooms.filter(room => room.isGeneral);
    const otherRooms = rooms.filter(room => !room.isGeneral);
    
    const filteredGeneralChat = generalChatRooms.length > 0 ? [generalChatRooms[0]] : [];
    
    return [...filteredGeneralChat, ...otherRooms];
  }

  async getGeneralRoom() {
    const generalRooms = await this.chatRoomRepository.find({
      where: { isGeneral: true },
      relations: ['members'],
      order: { createdAt: 'ASC' },
    });

    if (generalRooms.length > 0) {
      return generalRooms[0];
    }

    const generalRoom = this.chatRoomRepository.create({
      name: 'Chat général',
      isGeneral: true,
      members: [],
    });
    return await this.chatRoomRepository.save(generalRoom);
  }

  async joinGeneralRoom(userId: string) {
    const generalRoom = await this.getGeneralRoom();
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const fullRoom = await this.chatRoomRepository.findOne({
      where: { id: generalRoom.id },
      relations: ['members'],
    });

    if (!fullRoom) {
      throw new NotFoundException('General room not found');
    }

    const isAlreadyMember = fullRoom.members.some(member => member.id === userId);

    if (!isAlreadyMember) {
      try {
        fullRoom.members.push(user);
        await this.chatRoomRepository.save(fullRoom);

        const memberSetting = this.chatRoomMemberRepository.create({
          userId,
          chatRoomId: generalRoom.id,
          hasHistoryAccess: true,
        });
        await this.chatRoomMemberRepository.save(memberSetting);
      } catch (error) {
        if (!error.message?.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }

    return generalRoom;
  }

  async addReaction(userId: string, messageId: string, emoji: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const message = await this.messageRepository.findOne({ 
      where: { id: messageId },
      relations: ['reactions', 'reactions.user'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existingReaction = message.reactions?.find(
      r => r.user.id === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return existingReaction;
    }

    const reaction = this.reactionRepository.create({
      emoji,
      user,
      message,
      messageId,
    });

    return this.reactionRepository.save(reaction);
  }

  async removeReaction(reactionId: string, userId: string) {
    const reaction = await this.reactionRepository.findOne({
      where: { id: reactionId },
      relations: ['user'],
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    if (reaction.user.id !== userId) {
      throw new ForbiddenException('You can only remove your own reactions');
    }

    await this.reactionRepository.remove(reaction);
  }

  async addMembersToRoom(roomId: string, userId: string, memberIds: string[], hasHistoryAccess: boolean = true) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (room.creatorId !== userId) {
      throw new ForbiddenException('Only the room creator can add members');
    }

    const usersToAdd = await this.userRepository.find({
      where: { id: In(memberIds) },
    });

    if (usersToAdd.length !== memberIds.length) {
      throw new NotFoundException('Some users not found');
    }

    const newMembers = usersToAdd.filter(
      user => !room.members.some(member => member.id === user.id)
    );

    if (newMembers.length > 0) {
      room.members.push(...newMembers);
      await this.chatRoomRepository.save(room);

      for (const newMember of newMembers) {
        const memberSetting = this.chatRoomMemberRepository.create({
          userId: newMember.id,
          chatRoomId: roomId,
          hasHistoryAccess,
        });
        await this.chatRoomMemberRepository.save(memberSetting);
      }
    }

    return this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['members', 'memberSettings'],
    });
  }
}
