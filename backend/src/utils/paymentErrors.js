/**
 * Turns a payment-gateway failure into what the customer should see.
 * Account-level rejections (gateway not activated, bad credentials) are our
 * problem, not the shopper's, so they get a plain "temporarily unavailable" message.
 */
const ACCOUNT_ERROR_PATTERN =
  /not enabled|not activated|not active|authentication failed|invalid client|merchant.*(inactive|blocked|suspended)/i;

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Online payment is temporarily unavailable. Please try again in a little while, or message us on WhatsApp to place your order.";

export function isGatewayAccountError(err) {
  if (!err) return false;
  if (err.gatewayStatus === 401 || err.gatewayStatus === 403) return true;
  return ACCOUNT_ERROR_PATTERN.test(String(err.message || err));
}

export function customerPaymentError(err, fallbackMessage) {
  if (isGatewayAccountError(err)) {
    return { message: PAYMENTS_UNAVAILABLE_MESSAGE, statusCode: 503 };
  }
  return { message: fallbackMessage, statusCode: 500 };
}
