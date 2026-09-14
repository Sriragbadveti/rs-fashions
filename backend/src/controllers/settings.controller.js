import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { invalidateBootstrapCache } from "./bootstrap.controller.js";

/**
 * Controller: Store Settings & POS Device Configuration
 */

export const DEFAULT_SALE_CONFIG = {
  isEnabled: true,
  saleTitle: "For Sale & Exclusive Offers",
  subtitle: "Special artisanal drapes with exclusive combo bundle pricing",
  discountBadge: "Bundle Offers",
  couponCode: "FESTIVEBUNDLE",
  tierOffers: [
    { id: "tier-1", qty: 1, price: 2500, label: "Buy 1 @2500/-", savingsText: "Special Single Drape Offer" },
    { id: "tier-2", qty: 2, price: 4900, label: "Buy 2 @4900/-", savingsText: "Popular Double Drape Combo" },
    { id: "tier-3", qty: 3, price: 4800, label: "Buy 3 @4800/-", savingsText: "Grand Celebration Value" },
  ],
  saleItems: [],
  saleProductIds: [],
};

// 1. GET ALL SETTINGS
export async function getSettings(req, res) {
  try {
    if (!supabase) return successResponse(res, { settings: { sale_config: DEFAULT_SALE_CONFIG } });

    const { data, error } = await supabase.from("settings").select("*");
    if (error) throw error;

    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    if (!settings.sale_config) {
      settings.sale_config = DEFAULT_SALE_CONFIG;
    }

    return successResponse(res, { settings }, "Store settings retrieved");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. GET SALE CONFIG
export async function getSaleConfig(req, res) {
  try {
    if (!supabase) {
      return successResponse(res, { saleConfig: DEFAULT_SALE_CONFIG });
    }

    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "sale_config")
      .maybeSingle();

    if (error) {
      console.warn("Error fetching sale config:", error.message);
      return successResponse(res, { saleConfig: DEFAULT_SALE_CONFIG });
    }

    return successResponse(
      res,
      { saleConfig: data?.value || DEFAULT_SALE_CONFIG },
      "Sale configuration retrieved"
    );
  } catch (err) {
    return successResponse(res, { saleConfig: DEFAULT_SALE_CONFIG });
  }
}

// 3. UPDATE SALE CONFIG
export async function updateSaleConfig(req, res) {
  try {
    const saleConfig = req.body;
    if (!saleConfig || typeof saleConfig !== "object") {
      return errorResponse(res, "Invalid sale configuration", 400);
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("settings")
        .upsert({
          key: "sale_config",
          value: saleConfig,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      invalidateBootstrapCache();
      if (error) throw error;
      return successResponse(res, { saleConfig: data.value }, "Sale configuration updated successfully");
    }

    invalidateBootstrapCache();
    return successResponse(res, { saleConfig }, "Sale configuration updated locally");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 4. UPDATE GENERIC SETTING
export async function updateSetting(req, res) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return errorResponse(res, "Setting value is required", 400);
    }

    if (supabase) {
      const { data, error } = await supabase.from("settings").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      }).select().single();

      invalidateBootstrapCache();
      if (error) throw error;
      return successResponse(res, { setting: data }, `Setting '${key}' updated successfully`);
    }

    invalidateBootstrapCache();
    return successResponse(res, { key, value }, "Setting updated locally");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
