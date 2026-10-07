import { test } from "node:test";
import assert from "node:assert/strict";
import {
  customerPaymentError,
  isGatewayAccountError,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "../src/utils/paymentErrors.js";

test("gateway account not activated shows a friendly 503, not Cashfree's text", () => {
  const err = new Error("transactions are not enabled for your payment gateway account");
  const out = customerPaymentError(err, err.message);
  assert.equal(out.statusCode, 503);
  assert.equal(out.message, PAYMENTS_UNAVAILABLE_MESSAGE);
});

test("gateway auth rejections (401/403) count as account errors", () => {
  const err = Object.assign(new Error("something odd"), { gatewayStatus: 401 });
  assert.equal(isGatewayAccountError(err), true);
});

test("other failures keep their message and a 500", () => {
  const err = Object.assign(new Error("order_amount is invalid"), { gatewayStatus: 400 });
  assert.deepEqual(customerPaymentError(err, err.message), { message: "order_amount is invalid", statusCode: 500 });
  assert.equal(isGatewayAccountError(null), false);
});
