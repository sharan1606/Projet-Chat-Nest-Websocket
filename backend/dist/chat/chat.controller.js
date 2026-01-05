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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_room_dto_1 = require("./dto/create-room.dto");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getUserRooms(req) {
        return this.chatService.getUserRooms(req.user.id);
    }
    async getGeneralRoom() {
        return this.chatService.getGeneralRoom();
    }
    async joinGeneralRoom(req) {
        return this.chatService.joinGeneralRoom(req.user.id);
    }
    async createRoom(req, createRoomDto) {
        return this.chatService.createRoom(createRoomDto, req.user.id);
    }
    async getRoomMessages(req, roomId) {
        return this.chatService.getRoomMessages(roomId, req.user.id);
    }
    async addMembersToRoom(req, roomId, body) {
        return this.chatService.addMembersToRoom(roomId, req.user.id, body.memberIds, body.hasHistoryAccess ?? true);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('rooms'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserRooms", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('general'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getGeneralRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('general/join'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "joinGeneralRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('rooms'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_room_dto_1.CreateRoomDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('rooms/:roomId/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRoomMessages", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('rooms/:roomId/members'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMembersToRoom", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map