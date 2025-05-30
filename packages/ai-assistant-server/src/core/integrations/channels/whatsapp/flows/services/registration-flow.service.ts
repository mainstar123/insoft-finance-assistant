import { UserNotFoundException } from '@/features/user/exceptions/user.exception';
import { UserService } from '@/features/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { DecryptedFlowRequest } from '../dto/decrypted-flow-request.dto';
import {
  FlowDataExchangeResponse,
  FlowDataExchangeSuccessResponse,
  FlowInitResponse,
  FlowResponse,
} from '../dto/flow-response-payload.dto';
import { FlowMessagingService } from './flow-messaging.service';

@Injectable()
export class RegistrationFlowService {
  private readonly logger = new Logger(RegistrationFlowService.name);
  private readonly flowVersion: string;

  constructor(
    private readonly userService: UserService,
    private readonly flowMessagingService: FlowMessagingService,
  ) {
    this.flowVersion = '7.0';
    this.logger.log('Registration flow service initialized');
  }

  /**
   * Send a registration flow message to a user
   * @param to The recipient's phone number
   * @returns The WhatsApp API response
   */
  async sendRegistrationFlow(to: string, language: string = 'pt') {
    this.logger.debug(`Starting registration flow for phone: ${to}`);

    try {
      const user = await this.userService.findByPhoneNumber(to);
      this.logger.debug(`User found:`, {
        userId: user?.id,
        phoneNumber: user?.phoneNumber,
      });

      // Determine registration status
      const status = user ? 'CONFIRMED' : 'NOT_STARTED';
      this.logger.debug(`User registration status: ${status}`);

      // Prepare user data if available
      const userData = user
        ? {
            name: user.name || undefined,
            email: user.email || undefined,
            phoneNumber: user.phoneNumber || undefined,
            marketingConsent: user.marketingConsent || false,
          }
        : undefined;

      // Send the registration flow using the flow messaging service
      return this.flowMessagingService.sendRegistrationFlow(
        to,
        status,
        userData,
        language as any,
      );
    } catch (error) {
      this.logger.error(
        `Error sending registration flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Handle a registration flow request
   * @param request The flow request
   * @returns A flow response
   */
  async handleFlowRequest(
    request: DecryptedFlowRequest,
  ): Promise<FlowResponse> {
    try {
      this.logger.debug('Processing registration flow request', {
        screen: request.screen,
        action: request.action,
      });

      // Handle different actions
      switch (request.action) {
        case 'init':
          return this.handleInitAction(request);
        case 'navigate':
          return this.handleNavigateAction(request);
        case 'data_exchange':
          return this.handleDataExchangeAction(request);
        default:
          this.logger.warn(`Unknown action: ${request.action}`);
          return {
            version: this.flowVersion,
            data: {
              acknowledged: true,
            },
          };
      }
    } catch (error) {
      this.logger.error(
        `Error handling registration flow request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Return a generic error response
      return {
        version: this.flowVersion,
        data: {
          acknowledged: true,
        },
      };
    }
  }

  /**
   * Handle the init action
   * @param request The flow request
   * @returns A flow response
   */
  private handleInitAction(request: DecryptedFlowRequest): FlowInitResponse {
    this.logger.log('Handling init action');

    // Return the initial screen
    return {
      version: this.flowVersion,
      screen: 'ENTRY',
      data: {},
    };
  }

  /**
   * Handle the navigate action
   * @param request The flow request
   * @returns A flow response
   */
  private handleNavigateAction(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    this.logger.log(`Handling navigate action to screen: ${request.screen}`);

    // Process the current screen
    switch (request.screen) {
      case 'ENTRY':
        return this.handleEntryScreen(request);
      case 'ACCOUNT_CREATION_BASIC':
        return this.handleBasicInfoScreen(request);
      case 'ACCOUNT_CREATION_PERSONAL':
        return this.handlePersonalInfoScreen(request);
      case 'ACCOUNT_CREATION_GOALS':
        return this.handleGoalsScreen(request);
      case 'ACCOUNT_CREATION_SUCCESS':
        return this.handleSuccessScreen(request);
      default:
        this.logger.warn(`Unknown screen: ${request.screen}`);
        return {
          version: this.flowVersion,
          screen: 'ENTRY',
          data: {},
        };
    }
  }

  /**
   * Handle the data_exchange action
   * @param request The flow request
   * @returns A flow response
   */
  private async handleDataExchangeAction(
    request: DecryptedFlowRequest,
  ): Promise<FlowDataExchangeSuccessResponse> {
    this.logger.log('Handling data_exchange action');

    try {
      // Extract user data from the request
      const userData = request.data;

      // Try to get phone number from different possible sources
      let phoneNumber = userData.phone_number;

      // Log available data fields for debugging
      this.logger.debug('Available data in request:', {
        dataKeys: Object.keys(userData),
        hasPhoneNumber: !!phoneNumber,
        flowToken: request.flow_token,
      });

      // If not found directly, try to extract from other possible fields
      if (!phoneNumber) {
        this.logger.warn(
          'Phone number not found in primary location. Checking alternatives...',
        );

        // Look for phone number in parent object fields or nested fields
        if (userData.from) {
          phoneNumber = userData.from;
          this.logger.debug('Found phone number in userData.from');
        } else if (userData.contact?.wa_id) {
          phoneNumber = userData.contact.wa_id;
          this.logger.debug('Found phone number in userData.contact.wa_id');
        } else if (userData.metadata?.phone) {
          phoneNumber = userData.metadata.phone;
          this.logger.debug('Found phone number in userData.metadata.phone');
        } else if (userData.init_values?.phoneNumber) {
          phoneNumber = userData.init_values.phoneNumber;
          this.logger.debug(
            'Found phone number in userData.init_values.phoneNumber',
          );
        }
      }

      // If still not found and we're in development mode, use a placeholder for testing
      if (!phoneNumber && process.env.NODE_ENV !== 'production') {
        this.logger.warn('Using development mode fallback for phone number');
        phoneNumber = 'whatsapp-test-user';
      }

      // Final check - if we couldn't find a phone number anywhere
      if (!phoneNumber) {
        this.logger.error(
          'Phone number not found in any field of the request data',
          {
            availableData: JSON.stringify(userData).substring(0, 500),
          },
        );
        throw new Error(
          'Phone number is required but not found in request data',
        );
      }

      // Create or update user
      const user = await this.userService.createOrFindByPhoneNumber({
        phoneNumber,
        name: userData.name,
        email: userData.email,
      });

      // Update additional user information
      if (user && user.id) {
        const updatedUser = await this.userService.update(user.id, {
          birthDate: userData.birthDate,
          gender: userData.gender,
          postalCode: userData.postalCode,
          marketingConsent: userData.marketingConsent,
        });

        this.logger.debug('User updated successfully', {
          userId: updatedUser?.id,
        });
      } else {
        throw new UserNotFoundException(0);
      }

      // Return a success response
      return {
        version: this.flowVersion,
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: {
              flow_token: request.flow_token,
              response: 'Account created successfully',
            },
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating/updating user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Return a success response with an error message
      return {
        version: this.flowVersion,
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: {
              flow_token: request.flow_token,
              response: 'Failed to create account. Please try again later.',
            },
          },
        },
      };
    }
  }

  /**
   * Handle the entry screen
   * @param request The flow request
   * @returns A flow response
   */
  private handleEntryScreen(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    // Preserve the phone number from the request
    const phoneNumber = request.data.phone_number;
    this.logger.debug('Entry screen phone number:', { phoneNumber });

    return {
      version: this.flowVersion,
      screen: 'ACCOUNT_CREATION_BASIC',
      data: {
        phone_number: phoneNumber,
      },
    };
  }

  /**
   * Handle the basic info screen
   * @param request The flow request
   * @returns A flow response
   */
  private handleBasicInfoScreen(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    return {
      version: this.flowVersion,
      screen: 'ACCOUNT_CREATION_PERSONAL',
      data: {
        name: request.data.name,
        email: request.data.email,
        password: request.data.password,
        termsAccepted: request.data.termsAccepted,
        phone_number: request.data.phone_number,
      },
    };
  }

  /**
   * Handle the personal info screen
   * @param request The flow request
   * @returns A flow response
   */
  private handlePersonalInfoScreen(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    return {
      version: this.flowVersion,
      screen: 'ACCOUNT_CREATION_GOALS',
      data: {
        ...request.data,
        birthDate: request.data.birthDate,
        gender: request.data.gender,
        postalCode: request.data.postalCode,
        phone_number: request.data.phone_number,
      },
    };
  }

  /**
   * Handle the goals screen
   * @param request The flow request
   * @returns A flow response
   */
  private handleGoalsScreen(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    return {
      version: this.flowVersion,
      screen: 'ACCOUNT_CREATION_SUCCESS',
      data: {
        ...request.data,
        financialGoal: request.data.financialGoal,
        financialChallenge: request.data.financialChallenge,
        marketingConsent: request.data.marketingConsent,
        phone_number: request.data.phone_number,
      },
    };
  }

  /**
   * Handle the success screen
   * @param request The flow request
   * @returns A flow response
   */
  private handleSuccessScreen(
    request: DecryptedFlowRequest,
  ): FlowDataExchangeResponse {
    return {
      version: this.flowVersion,
      screen: 'SUCCESS',
      data: {
        ...request.data,
        phone_number: request.data.phone_number,
      },
    };
  }
}
