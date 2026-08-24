/**
 * NIRANTAR — Action Policy & Permission Engine
 * ============================================
 * Defines allowed safe actions, confirmation-gated consequential actions,
 * and hard-blocked impossible actions.
 */

export type NirantarActionType =
  | 'NONE'
  | 'NAVIGATE'
  | 'HIGHLIGHT'
  | 'SET_SORT'
  | 'SET_FILTER'
  | 'AUTOFILL'
  | 'OPEN_HELP'
  | 'RESUME_TASK'
  | 'OPEN_TICKET'
  | 'OPEN_TRACKING'
  | 'SUBMIT_BOOKING'
  | 'PAYMENT'
  | 'READ_OTP'
  | 'READ_UPI_PIN'
  | 'READ_PASSWORD'
  | 'READ_CVV'
  | 'EXPORT_USER_DATA';

export interface NirantarActionCue {
  type: NirantarActionType;
  target?: string; // DOM target element ID or route
  style?: 'GREEN_ARROW' | 'PULSE' | 'SPOTLIGHT';
  parameters?: Record<string, any>;
  requiresConfirmation: boolean;
  explanation?: string;
}

export class ActionPolicyEngine {
  // 1. Strictly Impossible Actions (Hard Blocked)
  private static readonly IMPOSSIBLE_ACTIONS: NirantarActionType[] = [
    'READ_OTP',
    'READ_UPI_PIN',
    'READ_PASSWORD',
    'READ_CVV',
    'EXPORT_USER_DATA',
  ];

  // 2. Consequential Actions requiring explicit citizen confirmation
  private static readonly CONSEQUENTIAL_ACTIONS: NirantarActionType[] = [
    'SUBMIT_BOOKING',
    'PAYMENT',
  ];

  // 3. Safe non-destructive UI actions
  private static readonly SAFE_ACTIONS: NirantarActionType[] = [
    'NONE',
    'NAVIGATE',
    'HIGHLIGHT',
    'SET_SORT',
    'SET_FILTER',
    'AUTOFILL',
    'OPEN_HELP',
    'RESUME_TASK',
    'OPEN_TICKET',
    'OPEN_TRACKING',
  ];

  public static isActionAllowed(actionType: NirantarActionType): boolean {
    if (this.IMPOSSIBLE_ACTIONS.includes(actionType)) {
      return false;
    }
    return this.SAFE_ACTIONS.includes(actionType) || this.CONSEQUENTIAL_ACTIONS.includes(actionType);
  }

  public static requiresUserConfirmation(actionType: NirantarActionType): boolean {
    return this.CONSEQUENTIAL_ACTIONS.includes(actionType);
  }

  public static sanitizeActionCue(rawAction: any): NirantarActionCue {
    if (!rawAction || typeof rawAction !== 'object') {
      return { type: 'NONE', requiresConfirmation: false };
    }

    const type = (rawAction.type || rawAction.action_type || 'NONE').toUpperCase() as NirantarActionType;

    if (!this.isActionAllowed(type)) {
      console.warn(`[ActionPolicyEngine] Blocked illegal action type: ${type}`);
      return {
        type: 'NONE',
        requiresConfirmation: false,
        explanation: 'Action blocked by Nirantar Safety Policy.',
      };
    }

    return {
      type,
      target: typeof rawAction.target === 'string' ? rawAction.target : undefined,
      style: rawAction.style === 'GREEN_ARROW' || rawAction.style === 'SPOTLIGHT' || rawAction.style === 'PULSE' ? rawAction.style : 'GREEN_ARROW',
      parameters: rawAction.parameters && typeof rawAction.parameters === 'object' ? rawAction.parameters : undefined,
      requiresConfirmation: this.requiresUserConfirmation(type),
      explanation: typeof rawAction.explanation === 'string' ? rawAction.explanation : undefined,
    };
  }
}
