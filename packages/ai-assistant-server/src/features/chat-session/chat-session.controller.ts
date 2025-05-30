import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatSessionService } from './chat-session.service';
import {
  CreateChatSessionDto,
  AddChatMessageDto,
} from './dto/create-chat-session.dto';
import {
  ChatSessionResponseDto,
  ChatMessageResponseDto,
} from './dto/chat-session-response.dto';
import { ChatSessionMapper } from './mappers/chat-session.mapper';
import { ChatSessionOwnerGuard } from './guards/chat-session-owner.guard';

@ApiTags('chat-sessions')
@UseGuards(ChatSessionOwnerGuard)
@Controller('chat-sessions')
export class ChatSessionController {
  constructor(private readonly chatSessionService: ChatSessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  async create(
    @Body() createDto: CreateChatSessionDto,
  ): Promise<ChatSessionResponseDto> {
    const session = await this.chatSessionService.create(createDto);
    return ChatSessionMapper.toResponse(session);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all chat sessions for a user' })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ChatSessionResponseDto[]> {
    const sessions = await this.chatSessionService.findAll(userId);
    return sessions.map(ChatSessionMapper.toResponse);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages in a chat session' })
  async getMessages(
    @Param('id', ParseIntPipe) sessionId: number,
  ): Promise<ChatMessageResponseDto[]> {
    const messages = await this.chatSessionService.getMessages(sessionId);
    return messages?.map(ChatSessionMapper.messageToEntity) ?? [];
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a chat session' })
  async addMessage(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() messageDto: AddChatMessageDto,
  ): Promise<ChatMessageResponseDto> {
    const newMessage = await this.chatSessionService.addMessage(
      sessionId,
      messageDto,
    );
    return ChatSessionMapper.messageToEntity(newMessage);
  }
}
