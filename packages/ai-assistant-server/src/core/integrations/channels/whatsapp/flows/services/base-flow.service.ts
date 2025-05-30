import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DecryptedFlowRequest } from '../dto/decrypted-flow-request.dto';
import {
  FlowErrorResponse,
  FlowPingResponse,
  FlowResponse,
} from '../dto/flow-response-payload.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsAppConfigService } from '../../services/whatsapp-config.service';

// Define flow status type
export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';

// Define flow interface
export interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  categories: string[];
}

// Define dynamic FlowName type based on known flows
export type FlowName =
  | 'register-user-flow'
  | 'register-user-flow-en'


@Injectable()
export class BaseFlowService implements OnModuleInit {
  private readonly logger = new Logger(BaseFlowService.name);
  private readonly flowVersion: string;
  private readonly flowsMap = new Map<string, Flow>();
  private readonly wabaId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly whatsAppConfigService: WhatsAppConfigService,
  ) {
    this.flowVersion = '7.0';
    this.wabaId = this.whatsAppConfigService.getWabaId();
    this.logger.log('Base flow service initialized');
  }

  async onModuleInit() {
    try {
      // Fetch flows from WhatsApp API
      const { data } = await firstValueFrom(
        this.httpService.get(`/${this.wabaId}/flows`),
      );

      if (!data?.data) {
        throw new Error('Invalid response from WhatsApp API');
      }

      // Store flows in map
      for (const flow of data.data) {
        this.flowsMap.set(flow.name, {
          id: flow.id,
          name: flow.name,
          status: flow.status as FlowStatus,
          categories: flow.categories || [],
        });
        this.logger.log(
          `Registered flow: ${flow.name} (${flow.status}) with ID: ${flow.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize flows:', error);
      // Don't throw error, use fallback to env vars
      this.initializeFallbackFlows();
    }
  }

  private initializeFallbackFlows() {
    this.logger.warn(
      'Using fallback flow configuration from environment variables',
    );

    // Add registration flow as fallback
    const registrationFlowId = this.configService.get<string>(
      'WHATSAPP_REGISTRATION_FLOW_ID',
      '1234567890',
    );

    this.flowsMap.set('register-user-flow', {
      id: registrationFlowId,
      name: 'register-user-flow',
      status: 'PUBLISHED',
      categories: ['REGISTRATION'],
    });

    this.flowsMap.set('register-user-flow-en', {
      id: registrationFlowId,
      name: 'register-user-flow-en',
      status: 'PUBLISHED',
      categories: ['REGISTRATION'],
    });
  }

  /**
   * Get the flow ID for a given flow name
   * @param flowName The flow name
   * @returns The flow ID
   */
  getFlowId(flowName: string): string {
    const flow = this.flowsMap.get(flowName);

    if (!flow) {
      this.logger.warn(`Flow ID not found for flow name: ${flowName}`);
      return '0000000000';
    }

    // Check if flow is in a valid status
    if (flow.status === 'DEPRECATED') {
      this.logger.warn(`Flow ${flowName} is deprecated`);
      return '0000000000';
    }

    return flow.id;
  }

  /**
   * Get the status of a flow
   * @param flowName The flow name
   * @returns The flow status
   */
  getFlowStatus(flowName: string): FlowStatus {
    const flow = this.flowsMap.get(flowName);
    return flow?.status || 'DRAFT';
  }

  /**
   * Check if a flow exists and is active
   * @param flowName The flow name
   * @returns True if the flow exists and is not deprecated
   */
  isFlowActive(flowName: string): boolean {
    const flow = this.flowsMap.get(flowName);
    return !!flow && flow.status !== 'DEPRECATED';
  }

  /**
   * Get all registered flows
   * @returns Map of all flows
   */
  getAllFlows(): Map<string, Flow> {
    return new Map(this.flowsMap);
  }

  /**
   * Handle common flow requests
   * @param request The flow request
   * @returns A flow response if the request was handled, null otherwise
   */
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

  /**
   * Handle a ping request
   * @returns A ping response
   */
  private handlePingRequest(): FlowPingResponse {
    this.logger.log('Handling ping request');

    return {
      version: this.flowVersion,
      data: {
        status: 'active',
      },
    };
  }
}
