import { UserTier } from '../types/auth';

export interface PlanConfig {
  id: string;
  name: string;
  nameThai: string;
  priceTHB: number;
  priceUSD: number;
  billingInterval: 'one_time' | 'month' | 'year';
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

export const BILLING_PLANS: Record<string, PlanConfig> = {
  day_pass: {
    id: 'day_pass',
    name: 'Day Pass (24 Hours)',
    nameThai: 'บัตรผ่าน 24 ชั่วโมง (เติมเงิน)',
    priceTHB: 99,
    priceUSD: 2.99,
    billingInterval: 'one_time',
    description: 'Instant full access for 24 hours. Perfect for weekend practice sessions.',
    features: [
      'Full M1 & M5 60 FPS Replay',
      'FTMO / Prop Firm Challenge Mode',
      'PromptPay instant unlock',
      'Unlimited trades & Journal',
      'No watermark',
    ],
  },
  week_pass: {
    id: 'week_pass',
    name: 'Week Pass (7 Days)',
    nameThai: 'บัตรผ่าน 7 วัน',
    priceTHB: 199,
    priceUSD: 5.99,
    billingInterval: 'one_time',
    description: '1 full week of intensive backtesting and drill training.',
    features: [
      'Everything in Day Pass',
      'Valid for 7 full days',
      'Multi-Asset Support (Forex & Crypto)',
      'Cloud Session Saves',
    ],
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Trader Monthly',
    nameThai: 'สมาชิกรายเดือน (ยอดนิยม)',
    priceTHB: 490,
    priceUSD: 14.0,
    billingInterval: 'month',
    popular: true,
    badge: 'MOST POPULAR',
    description: 'For active traders aiming to pass prop firm challenges.',
    features: [
      'Unlimited M1, M5, M15, H1, D1 Replay',
      'FTMO & Funding Pips Rules Simulator',
      'Cloud Sync & Auto-Save across devices',
      'Multi-Asset Data Lake (Gold, Forex, Crypto)',
      'Custom CSV Upload',
      'Zero Watermark & Priority Data Stream',
    ],
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Trader Annual',
    nameThai: 'สมาชิกรายปี (ประหยัด 24%)',
    priceTHB: 4500,
    priceUSD: 129.0,
    billingInterval: 'year',
    badge: 'BEST VALUE',
    description: 'Ultimate backtesting toolkit with 2 months free.',
    features: [
      'All Pro Monthly Features',
      'Save 24% compared to monthly',
      'VIP Discord Trader Role & Strategy Templates',
      'Early access to new Asset packs',
      '1-on-1 Session Sharing Review Link',
    ],
  },
};

export interface CouponDiscount {
  code: string;
  discountPercent: number;
  description: string;
}

export const VALID_COUPONS: Record<string, CouponDiscount> = {
  LAUNCH50: {
    code: 'LAUNCH50',
    discountPercent: 50,
    description: 'Grand Launch Special (50% OFF)',
  },
  PROPTRADER: {
    code: 'PROPTRADER',
    discountPercent: 30,
    description: 'Prop Firm Trader Discount (30% OFF)',
  },
  METHA: {
    code: 'METHA',
    discountPercent: 25,
    description: 'VIP Founder Community Perk (25% OFF)',
  },
};

export type FeaturePermission =
  | 'timeframe_m1'
  | 'timeframe_m5'
  | 'prop_firm_mode'
  | 'multi_asset'
  | 'unlimited_journal'
  | 'custom_csv'
  | 'cloud_sync';

export class BillingEngine {
  private static instance: BillingEngine;

  private constructor() {}

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  /**
   * Check if a given user tier has permission to access a feature
   */
  public canAccessFeature(tier: UserTier, feature: FeaturePermission, passExpiresAt?: number): boolean {
    const isPassValid =
      (tier === 'day_pass' || tier === 'week_pass') &&
      Boolean(passExpiresAt && passExpiresAt > Date.now());

    if (tier === 'pro_monthly' || tier === 'pro_yearly' || tier === 'lifetime' || isPassValid) {
      return true; // Pro tiers unlock all features
    }

    // Free tier limitations
    switch (feature) {
      case 'timeframe_m1':
      case 'timeframe_m5':
        return false; // M1 & M5 require Pro
      case 'prop_firm_mode':
        return false; // Prop firm HUD requires Pro
      case 'multi_asset':
        return false; // Only Gold for Free tier
      case 'custom_csv':
        return true; // Free users can upload their own CSV
      case 'unlimited_journal':
        return false; // Free capped at 50 trades
      case 'cloud_sync':
        return false; // Local only for free
      default:
        return false;
    }
  }

  public hasWatermark(tier: UserTier, passExpiresAt?: number): boolean {
    const isPassValid =
      (tier === 'day_pass' || tier === 'week_pass') &&
      Boolean(passExpiresAt && passExpiresAt > Date.now());

    if (tier === 'pro_monthly' || tier === 'pro_yearly' || tier === 'lifetime' || isPassValid) {
      return false;
    }
    return true;
  }

  /**
   * Validate and calculate coupon discount
   */
  public applyCoupon(code: string, originalPriceTHB: number): {
    valid: boolean;
    discountPercent: number;
    finalPriceTHB: number;
    message: string;
  } {
    const upper = code.trim().toUpperCase();
    const coupon = VALID_COUPONS[upper];
    if (!coupon) {
      return {
        valid: false,
        discountPercent: 0,
        finalPriceTHB: originalPriceTHB,
        message: 'Invalid discount coupon code',
      };
    }

    const discountAmount = Math.round((originalPriceTHB * coupon.discountPercent) / 100);
    const finalPriceTHB = Math.max(0, originalPriceTHB - discountAmount);

    return {
      valid: true,
      discountPercent: coupon.discountPercent,
      finalPriceTHB,
      message: `${coupon.description}: Save ฿${discountAmount.toLocaleString()}`,
    };
  }

  /**
   * Generate Thai PromptPay EMVCo Standard Payload String
   * Supports standard Thai National ID / Mobile promptpay format
   */
  public generatePromptPayPayload(
    phoneNumberOrTaxId: string,
    amountTHB: number
  ): { payload: string; referenceId: string; qrSvgData: string } {
    // Generate clean unique reference ID
    const referenceId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Normalize phone number (e.g. 0812345678 -> 0066812345678)
    const cleanId = phoneNumberOrTaxId.replace(/[^0-9]/g, '');
    let target = cleanId;
    if (cleanId.startsWith('0') && cleanId.length === 10) {
      target = `0066${cleanId.substring(1)}`;
    }

    // EMVCo format segments
    const formattedAmount = amountTHB.toFixed(2);
    const payload = `00020101021229370016A0000006770101110113${target}5802TH530376454${String(
      formattedAmount.length
    ).padStart(2, '0')}${formattedAmount}62${String(referenceId.length + 4).padStart(
      2,
      '0'
    )}07${String(referenceId.length).padStart(2, '0')}${referenceId}6304`;

    // SVG QR mockup representation with exact styling
    const qrSvgData = this.generateSvgQrMock(payload, amountTHB, referenceId);

    return {
      payload,
      referenceId,
      qrSvgData,
    };
  }

  /**
   * Generates high-fidelity SVG matrix pattern representing PromptPay QR Code
   */
  private generateSvgQrMock(payload: string, amount: number, ref: string): string {
    // Return SVG data URI with beautiful PromptPay header and crisp QR code pattern
    const dots: string[] = [];
    const size = 25;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Corner markers
        const isCorner1 = r < 7 && c < 7;
        const isCorner2 = r < 7 && c >= size - 7;
        const isCorner3 = r >= size - 7 && c < 7;
        
        let filled = false;
        if (isCorner1 || isCorner2 || isCorner3) {
          const localR = isCorner1 ? r : isCorner2 ? r : r - (size - 7);
          const localC = isCorner1 ? c : isCorner2 ? c - (size - 7) : c;
          if (localR === 0 || localR === 6 || localC === 0 || localC === 6) filled = true;
          else if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) filled = true;
        } else {
          // pseudo-random deterministic fill based on payload hash
          const hash = (payload.charCodeAt((r * size + c) % payload.length) + r * 13 + c * 7) % 10;
          filled = hash > 4;
        }

        if (filled) {
          dots.push(`<rect x="${c * 8 + 20}" y="${r * 8 + 20}" width="7.5" height="7.5" rx="1.5" fill="#0f172a" />`);
        }
      }
    }

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <desc>Amount: ${amount} THB, Ref: ${ref}</desc>
      <rect width="240" height="240" fill="%23ffffff" rx="16"/>
      ${dots.join('')}
      <circle cx="120" cy="120" r="14" fill="%231e3a8a"/>
      <text x="120" y="124" font-family="sans-serif" font-weight="900" font-size="10" fill="%23ffffff" text-anchor="middle">PP</text>
    </svg>`;
  }
}
