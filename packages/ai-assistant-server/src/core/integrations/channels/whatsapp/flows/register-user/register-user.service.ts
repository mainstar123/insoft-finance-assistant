import { CreateUserDto } from '@/features/user/dto/create-user.dto';
import { UserService } from '@/features/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { FinancialGoal, Gender } from '@prisma/client';
import {
  DecryptedFlowRequest, FlowDataExchangeResponse,
  FlowDataExchangeSuccessResponse,
  FlowResponse
} from '../../whatsapp.types';
import { BaseFlowService } from '../base-flow.service';
import { UnhandledFlowException } from '../whatsapp-flow.errors';

@Injectable()
export class RegisterUserFlowService {
  private readonly logger = new Logger(RegisterUserFlowService.name);

  constructor(
    private readonly userService: UserService,
    private readonly baseService: BaseFlowService,
  ) {}

  async handleFlowRequest(
    decryptedRequest: DecryptedFlowRequest,
  ): Promise<FlowResponse> {
    const commonResponse =
      await this.baseService.handleCommonFlowRequest(decryptedRequest);
    if (commonResponse) {
      return commonResponse;
    }

    const { screen, action } = decryptedRequest;

    if (action === 'data_exchange') {
      switch (screen) {
        case 'ACCOUNT_CREATION_SUCCESS':
          return this.processRegister(decryptedRequest);
      }
    }

    this.logger.error('Unhandled request body:', decryptedRequest);
    throw new UnhandledFlowException();
  }

  private async processRegister(
    decryptedRequest: DecryptedFlowRequest,
  ): Promise<FlowDataExchangeResponse> {
    const { data, version, flow_token } = decryptedRequest;
    console.log('🚀 ~ RegisterUserFlowService ~ data:', data);

    try {
      const createUserDto: CreateUserDto = {
        name: data.name,
        email: data.email,
        phoneNumber: data.phone_number,
        password: data.password,
        termsAccepted: data.termsAccepted || true,
        marketingConsent: data.marketingConsent || false,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: (data.gender as Gender) || undefined,
        postalCode: data.postalCode,
        primaryFinancialGoal:
          (data.financialGoal as FinancialGoal) || FinancialGoal.SAVE_MONEY,
        financialChallenge: data.financialChallenge || undefined,
      };

      await this.userService.create(createUserDto);

      this.logger.log(`
=======================================================
🔔 USER CREATED SUCCESSFULLY 🔔
-------------------------------------------------------
📱 To: ${data.phone_number}
Name: ${data.name}
Email: ${data.email}
-------------------------------------------------------
=======================================================
      `);

      return {
        version,
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: {
              flow_token,
              response: 'Cadastro realizado com sucesso',
            },
          },
        },
      } satisfies FlowDataExchangeSuccessResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        version,
        screen: 'ACCOUNT_CREATION_SUCCESS',
        data: {
          ...data,
          error_messages: {
            email: errorMessage,
          },
        },
      };
    }
  }
}
