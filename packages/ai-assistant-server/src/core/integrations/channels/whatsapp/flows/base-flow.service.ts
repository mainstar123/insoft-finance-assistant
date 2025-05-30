import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WhatsAppService } from '../services/whatsapp.service';
import { DecryptedFlowRequest } from '../whatsapp.types';
import {
  FlowErrorResponse,
  FlowPingResponse,
  FlowResponse,
  ListFlowsResponse,
} from '../whatsapp.types';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { WhatsAppConfigService } from '../services/whatsapp-config.service';

export type FlowName = 'register-user-flow' | 'register-user-flow-en';

@Injectable()
export class BaseFlowService implements OnModuleInit {
  private readonly logger = new Logger(BaseFlowService.name);
  private readonly flowsMap = new Map<FlowName, string>();
  private readonly wabaId: string;

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly httpService: HttpService,
    private readonly whatsAppConfigService: WhatsAppConfigService,
  ) {
    this.wabaId = this.whatsAppConfigService.getWabaId();
    this.logger.log('Base flow service initialized');
  }

  async onModuleInit() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ListFlowsResponse>(`/${this.wabaId}/flows`),
      );

      console.log('🚀 ~ BaseFlowService ~ onModuleInit ~ data:', data);

      if (!data?.data) {
        throw new Error('Invalid response from WhatsApp API');
      }

      for (const flow of data.data) {
        this.flowsMap.set(flow.name as FlowName, flow.id);
        this.logger.log(`Registered flow: ${flow.name} with ID: ${flow.id}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize flows:', error);
      throw error;
    }
  }

  getFlowId(name: FlowName): string {
    const flowId = this.flowsMap.get(name);
    if (!flowId) {
      this.logger.error(`Flow not found: ${name}`);
      throw new Error(`Flow not found: ${name}`);
    }
    return flowId;
  }

  async handleCommonFlowRequest(
    decryptedRequest: DecryptedFlowRequest,
  ): Promise<FlowResponse | undefined> {
    const { data, version, action } = decryptedRequest;

    if (action === 'ping') {
      return {
        version,
        data: {
          status: 'active',
        },
      } satisfies FlowPingResponse;
    }

    if (data?.error) {
      this.logger.warn('Received client error:', data);
      return {
        version,
        data: {
          acknowledged: true,
        },
      } satisfies FlowErrorResponse;
    }
  }

  getFlowStatus(flowName: string): 'DRAFT' | 'PUBLISHED' | 'UNKNOWN' {
    const flow = this.flowsMap.get(flowName as FlowName);
    if (!flow) {
      this.logger.warn(`Flow not found: ${flowName}`);
      return 'UNKNOWN';
    }
    return 'PUBLISHED';
  }
}
