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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_room_entity_1 = require("../entities/chat-room.entity");
const message_entity_1 = require("../entities/message.entity");
const user_entity_1 = require("../entities/user.entity");
const reaction_entity_1 = require("../entities/reaction.entity");
const chat_room_member_entity_1 = require("../entities/chat-room-member.entity");
let ChatService = class ChatService {
    chatRoomRepository;
    messageRepository;
    userRepository;
    reactionRepository;
    chatRoomMemberRepository;
    constructor(chatRoomRepository, messageRepository, userRepository, reactionRepository, chatRoomMemberRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.reactionRepository = reactionRepository;
        this.chatRoomMemberRepository = chatRoomMemberRepository;
    }
    async createMessage(userId, roomId, content) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const room = await this.chatRoomRepository.findOne({
            where: { id: roomId },
            relations: ['members'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        const isMember = room.members.some(member => member.id === userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You are not a member of this chat room');
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
    async getRoomMessages(roomId, userId) {
        const room = await this.chatRoomRepository.findOne({
            where: { id: roomId },
            relations: ['members', 'memberSettings'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        const isMember = room.members.some(member => member.id === userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You are not a member of this chat room');
        }
        const memberSettings = room.memberSettings.find(ms => ms.userId === userId);
        if (memberSettings && !memberSettings.hasHistoryAccess) {
            return this.messageRepository.find({
                where: { chatRoomId: roomId },
                relations: ['user', 'reactions', 'reactions.user'],
                order: { createdAt: 'ASC' },
            }).then(messages => messages.filter(msg => new Date(msg.createdAt) >= new Date(memberSettings.joinedAt)));
        }
        return this.messageRepository.find({
            where: { chatRoomId: roomId },
            relations: ['user', 'reactions', 'reactions.user'],
            order: { createdAt: 'ASC' },
        });
    }
    async createRoom(createRoomDto, creatorId) {
        const { name, memberIds, hasHistoryAccess } = createRoomDto;
        const allMemberIds = [...new Set([creatorId, ...memberIds])];
        const users = await this.userRepository.find({
            where: { id: (0, typeorm_2.In)(allMemberIds) },
        });
        if (users.length !== allMemberIds.length) {
            throw new common_1.NotFoundException('Some users not found');
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
            }
            else {
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
    async getUserRooms(userId) {
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
    async joinGeneralRoom(userId) {
        const generalRoom = await this.getGeneralRoom();
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const fullRoom = await this.chatRoomRepository.findOne({
            where: { id: generalRoom.id },
            relations: ['members'],
        });
        if (!fullRoom) {
            throw new common_1.NotFoundException('General room not found');
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
            }
            catch (error) {
                if (!error.message?.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        }
        return generalRoom;
    }
    async addReaction(userId, messageId, emoji) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        const message = await this.messageRepository.findOne({
            where: { id: messageId },
            relations: ['reactions', 'reactions.user'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const existingReaction = message.reactions?.find(r => r.user.id === userId && r.emoji === emoji);
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
    async removeReaction(reactionId, userId) {
        const reaction = await this.reactionRepository.findOne({
            where: { id: reactionId },
            relations: ['user'],
        });
        if (!reaction) {
            throw new common_1.NotFoundException('Reaction not found');
        }
        if (reaction.user.id !== userId) {
            throw new common_1.ForbiddenException('You can only remove your own reactions');
        }
        await this.reactionRepository.remove(reaction);
    }
    async addMembersToRoom(roomId, userId, memberIds, hasHistoryAccess = true) {
        const room = await this.chatRoomRepository.findOne({
            where: { id: roomId },
            relations: ['members'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        if (room.creatorId !== userId) {
            throw new common_1.ForbiddenException('Only the room creator can add members');
        }
        const usersToAdd = await this.userRepository.find({
            where: { id: (0, typeorm_2.In)(memberIds) },
        });
        if (usersToAdd.length !== memberIds.length) {
            throw new common_1.NotFoundException('Some users not found');
        }
        const newMembers = usersToAdd.filter(user => !room.members.some(member => member.id === user.id));
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_room_entity_1.ChatRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(reaction_entity_1.Reaction)),
    __param(4, (0, typeorm_1.InjectRepository)(chat_room_member_entity_1.ChatRoomMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map