import { WhatsAppFlowsModule } from '@/core/integrations/channels/whatsapp/flows/flows.module';
import { UserService } from '@/features/user/user.service';
import { Module } from '@nestjs/common';
import { RegistrationTools } from './registration.tool';
@Module({
  imports: [WhatsAppFlowsModule],
  providers: [RegistrationTools, UserService],
  exports: [RegistrationTools],
})
export class ToolsModule {}
