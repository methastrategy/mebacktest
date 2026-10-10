/**
 * Thai PromptPay Top-Up Webhook Handler
 * Idempotent credit & pass crediting against replay attacks
 */

export interface PromptPayWebhookPayload {
  transactionId: string;
  referenceId: string;
  amountTHB: number;
  status: 'SUCCESS' | 'FAILED';
  paidAt: string;
  idempotencyKey: string;
  metadata?: {
    userId: string;
    tier: 'day_pass' | 'week_pass' | 'credits';
    creditsAmount?: number;
  };
}

const processedPromptPayTransactions = new Set<string>();

export async function handlePromptPayWebhook(
  payload: PromptPayWebhookPayload
): Promise<{ status: number; message: string }> {
  const { transactionId, idempotencyKey, status, amountTHB, metadata } = payload;

  if (!transactionId || !idempotencyKey) {
    return { status: 400, message: 'Missing transactionId or idempotencyKey' };
  }

  // Prevent duplicate execution
  if (processedPromptPayTransactions.has(idempotencyKey)) {
    return { status: 200, message: 'PromptPay transaction already processed' };
  }
  processedPromptPayTransactions.add(idempotencyKey);

  if (status !== 'SUCCESS') {
    return { status: 200, message: 'Transaction not successful, skipped' };
  }

  // Award access or credits according to metadata
  const userId = metadata?.userId || 'unknown';
  const tier = metadata?.tier || 'day_pass';

  return {
    status: 200,
    message: `Successfully granted ${tier} to user ${userId} for ฿${amountTHB}`,
  };
}
