import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/core/services';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import {
  IChatMessage,
  IChatSession,
} from './interfaces/chat-session.interface';
import { ChatSessionMapper } from './mappers/chat-session.mapper';
import { ChatSessionNotFoundException } from './exceptions/chat-session.exception';
import { AddChatMessageDto } from './dto/create-chat-session.dto';

@Injectable()
export class ChatSessionService {
  private readonly prisma: PrismaClient;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.client;
  }

  async create(createDto: CreateChatSessionDto): Promise<IChatSession> {
    const session = await this.prisma.chatSession.create({
      data: createDto,
      include: { messages: true },
    });
    return ChatSessionMapper.toEntity(session);
  }

  async findAll(userId: number): Promise<IChatSession[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      include: { messages: true },
    });
    return sessions.map(ChatSessionMapper.toEntity);
  }

  async findOne(id: number, userId: number): Promise<IChatSession> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
      include: { messages: true },
    });

    if (!session) {
      throw new ChatSessionNotFoundException(id);
    }

    return ChatSessionMapper.toEntity(session);
  }

  async getMessages(sessionId: number): Promise<IChatSession['messages']> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session) {
      throw new ChatSessionNotFoundException(sessionId);
    }

    return session.messages.map(ChatSessionMapper.messageToEntity);
  }

  async addMessage(
    sessionId: number,
    messageData: AddChatMessageDto,
  ): Promise<IChatMessage> {
    const message = await this.prisma.chatMessage.create({
      data: {
        ...messageData,
        sessionId,
      },
    });

    return ChatSessionMapper.messageToEntity(message);
  }
}
