import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AccountModule } from './account/account.module';
// import { LangGraphModule } from './finance-office-multi-agent/langgraph.module';
import { BudgetModule } from './budget/budget.module';
import { GoalModule } from './goal/goal.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from '@/core/integrations/redis/redis.module';
import { OrchestratorPatternModule } from './orchestrator-pattern';
// import { MultiAgentsModule } from './multi-agents/multi-agents.module';

@Module({
  imports: [
    UserModule,
    AccountModule,
    // LangGraphModule,
    BudgetModule,
    GoalModule,
    CategoryModule,
    AuthModule,
    RedisModule,
    // MultiAgentsModule,
    OrchestratorPatternModule,
  ],
  exports: [
    UserModule,
    AccountModule,
    // LangGraphModule,
    BudgetModule,
    GoalModule,
    CategoryModule,
  ],
})
export class FeaturesModule {}
