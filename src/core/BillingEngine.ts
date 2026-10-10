import { UserTier } from '../types/auth';
import QRCode from 'qrcode';

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
   * Calculates standard EMVCo CRC-16 (CCITT-FALSE: poly 0x1021, init 0xFFFF)
   */
  public calculateCrc16(data: string): string {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Validate whether a PromptPay EMVCo string has a valid CRC-16 checksum
   */
  public verifyPromptPayChecksum(payload: string): boolean {
    if (payload.length < 8) return false;
    const body = payload.substring(0, payload.length - 4);
    const expected = payload.substring(payload.length - 4).toUpperCase();
    return this.calculateCrc16(body) === expected;
  }

  /**
   * Generate Thai PromptPay EMVCo Standard Payload String
   * Supports standard Thai National ID / Mobile promptpay format with valid CRC16 and real scannable QR
   */
  public generatePromptPayPayload(
    phoneNumberOrTaxId: string,
    amountTHB: number
  ): { payload: string; referenceId: string; qrSvgData: string } {
    // Generate clean unique reference ID
    const referenceId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Normalize phone number (0812345678 -> 0066812345678) or National ID (13 digits)
    const cleanId = phoneNumberOrTaxId.replace(/[^0-9]/g, '');
    let subtag = '01';
    let target = cleanId;
    if (cleanId.startsWith('0') && cleanId.length === 10) {
      target = `0066${cleanId.substring(1)}`;
      subtag = '01';
    } else if (cleanId.length === 13) {
      subtag = '02';
    }

    const tag29Value = `0016A000000677010111${subtag}13${target}`;
    const formattedAmount = amountTHB.toFixed(2);

    let raw = `00020101021229${String(tag29Value.length).padStart(2, '0')}${tag29Value}5802TH5303764`;
    raw += `54${String(formattedAmount.length).padStart(2, '0')}${formattedAmount}`;
    const sub62 = `07${String(referenceId.length).padStart(2, '0')}${referenceId}`;
    raw += `62${String(sub62.length).padStart(2, '0')}${sub62}`;
    raw += '6304';

    const checksum = this.calculateCrc16(raw);
    const payload = `${raw}${checksum}`;

    // SVG QR matrix representation with exact styling
    const qrSvgData = this.generateSvgQr(payload, amountTHB, referenceId);

    return {
      payload,
      referenceId,
      qrSvgData,
    };
  }

  /**
   * Generates authentic, scannable QR Code SVG matrix
   */
  private generateSvgQr(payload: string, _amount: number, _ref: string): string {
    try {
      const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
      const size = qr.modules.size;
      const dots: string[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (qr.modules.get(r, c)) {
            dots.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="#0f172a" />`);
          }
        }
      }

      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${size + 4} ${size + 4}" width="240" height="240">
        <rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="%23ffffff" rx="1"/>
        ${dots.join('')}
      </svg>`;
    } catch {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><rect width="240" height="240" fill="%23ffffff"/><text x="120" y="120" text-anchor="middle" font-size="12">PromptPay QR</text></svg>`;
    }
  }
}
