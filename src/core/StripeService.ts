import { AuthService } from './AuthService';

export interface StripeCheckoutResult {
  sessionId: string;
  url: string;
  status: 'success' | 'cancelled';
}

export class StripeService {
  private static instance: StripeService;

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Initiates Stripe Checkout session for subscription
   */
  public async createCheckoutSession(params: {
    planId: string;
    couponCode?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<StripeCheckoutResult> {
    const user = AuthService.getInstance().getCurrentUser();
    const sessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}`;

    // In a production server, this invokes /api/stripe/create-checkout-session
    // For local and sandbox replay testing, simulate smooth checkout:
    return {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}?plan=${params.planId}&customer=${user?.email || 'trader'}`,
      status: 'success',
    };
  }

  /**
   * Redirects user to Stripe Customer Portal to manage subscriptions / cancel
   */
  public async redirectToCustomerPortal(): Promise<string> {
    return 'https://billing.stripe.com/p/session/test_portal_session';
  }
}
