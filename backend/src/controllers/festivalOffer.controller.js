import { successResponse, errorResponse } from "../utils/response.js";
import {
  computeFestivalOffer,
  isFestivalOfferActive,
  loadFestivalOfferConfig,
  resolveCartProducts,
} from "../services/festivalOffer.js";

/**
 * Controller: Festival Offer quotes (server-side; not used by the storefront yet)
 */

function publicConfig(config, active) {
  return {
    name: config.name,
    enabled: config.enabled,
    active,
    minPriceExclusive: config.minPriceExclusive,
    tiers: config.tiers,
    startsAt: config.startsAt,
    endsAt: config.endsAt,
  };
}

async function quote(req, res, { preview }) {
  try {
    const config = await loadFestivalOfferConfig();
    const items = await resolveCartProducts(req.body?.items);
    const offer = computeFestivalOffer(items, config, { ignoreSchedule: preview });
    return successResponse(
      res,
      { offer, config: publicConfig(config, isFestivalOfferActive(config)), preview },
      offer.discount > 0 ? `${config.name}: ₹${offer.discount} off` : "No festival discount for this cart"
    );
  } catch (err) {
    console.error("[Festival Offer] Quote error:", err.message);
    return errorResponse(res, "Could not work out the festival offer", 500);
  }
}

/** POST /api/billing/festival-offer/quote { items: [{ productId, quantity }] } — 0 off while switched off. */
export function quoteFestivalOffer(req, res) {
  return quote(req, res, { preview: false });
}

/** POST /api/admin/billing/festival-offer/preview — same, but works while the offer is switched off. */
export function previewFestivalOffer(req, res) {
  return quote(req, res, { preview: true });
}
