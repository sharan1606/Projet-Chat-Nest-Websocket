import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  async getUserRooms(@Request() req) {
    return this.chatService.getUserRooms(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('general')
  async getGeneralRoom() {
    return this.chatService.getGeneralRoom();
  }

  @UseGuards(JwtAuthGuard)
  @Post('general/join')
  async joinGeneralRoom(@Request() req) {
    return this.chatService.joinGeneralRoom(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  async createRoom(@Request() req, @Body(ValidationPipe) createRoomDto: CreateRoomDto) {
    return this.chatService.createRoom(createRoomDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId/messages')
  async getRoomMessages(@Request() req, @Param('roomId') roomId: string) {
    return this.chatService.getRoomMessages(roomId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/members')
  async addMembersToRoom(
    @Request() req,
    @Param('roomId') roomId: string,
    @Body() body: { memberIds: string[]; hasHistoryAccess?: boolean },
  ) {
    return this.chatService.addMembersToRoom(
      roomId,
      req.user.id,
      body.memberIds,
      body.hasHistoryAccess ?? true,
    );
  }
}
