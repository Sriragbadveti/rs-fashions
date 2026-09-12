import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Controller: Store Settings & POS Device Configuration
 */

// 1. GET SETTINGS
export async function getSettings(req, res) {
  try {
    if (!supabase) return successResponse(res, { settings: {} });

    const { data, error } = await supabase.from("settings").select("*");
    if (error) throw error;

    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return successResponse(res, { settings }, "Store settings retrieved");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. UPDATE SETTING
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

      if (error) throw error;
      return successResponse(res, { setting: data }, `Setting '${key}' updated successfully`);
    }

    return successResponse(res, { key, value }, "Setting updated locally");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
