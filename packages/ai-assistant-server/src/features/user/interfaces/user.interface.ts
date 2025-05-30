import { FinancialGoal, Gender } from '@/core/integrations/database/types';

export interface IUser {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string | null;
  passwordHash: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
  locale: string; // Default: "pt_BR"
  preferredCurrency: string; // Default: "BRL"
  birthDate?: Date | null;
  gender: Gender; // Default: "OTHER"
  primaryFinancialGoal?: FinancialGoal | null;
  financialChallenge?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Optional relations (if needed in the interface)
  accounts?: any[];
  creditCards?: any[];
  transactions?: any[];
  budgets?: any[];
  goals?: any[];
  chatSessions?: any[];
  userFeedback?: any[];
  userConsent?: any[];
  agentStateCheckpoints?: any[];
}
