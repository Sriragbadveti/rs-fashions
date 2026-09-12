import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Controller: Loom Production & Courier Order Tracking
 */

// 1. GET ALL TRACKED ORDERS
export async function getTrackedOrders(req, res) {
  try {
    if (!supabase) return successResponse(res, { trackedOrders: [] });

    const { data, error } = await supabase
      .from("tracked_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const trackedOrders = (data || []).map((t) => ({
      id: t.id,
      trackingNumber: t.tracking_number,
      direction: t.direction,
      title: t.title,
      partyName: t.party_name,
      partyContact: t.party_contact,
      location: t.location,
      skuList: Array.isArray(t.sku_list) ? t.sku_list : [],
      totalPieces: Number(t.total_pieces) || 1,
      totalValue: Number(t.total_value) || 0,
      courierOrLoomPartner: t.courier_or_loom_partner,
      currentStage: t.current_stage,
      estimatedCompletion: t.estimated_completion,
      lastUpdate: t.last_update,
      notes: t.notes || undefined,
      history: Array.isArray(t.history_timeline) ? t.history_timeline : [],
    }));

    return successResponse(res, { trackedOrders }, "Tracked orders retrieved successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 2. CREATE TRACKED ORDER
export async function createTrackedOrder(req, res) {
  try {
    const {
      id,
      trackingNumber,
      direction = "inward",
      title,
      partyName,
      partyContact,
      location,
      skuList = [],
      totalPieces = 1,
      totalValue = 0,
      courierOrLoomPartner,
      currentStage = "Initiated",
      estimatedCompletion,
      lastUpdate,
      notes,
      history = [],
    } = req.body;

    if (!partyName || !partyContact) {
      return errorResponse(res, "Party name and contact are required", 400);
    }

    const orderId = id || `trk-${Date.now().toString(36)}`;
    const finalTrackingNumber = trackingNumber || `TRK-${direction === 'inward' ? 'IN' : 'OUT'}-${Date.now().toString().slice(-6)}`;
    const updateTime = lastUpdate || new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const initialHistory = history.length > 0 ? history : [
      {
        stage: currentStage,
        timestamp: updateTime,
        note: `Order pipeline entry created (${direction.toUpperCase()})`,
      }
    ];

    if (supabase) {
      const { data, error } = await supabase.from("tracked_orders").upsert({
        id: orderId,
        tracking_number: finalTrackingNumber,
        direction,
        title: title || `${direction === 'inward' ? 'Loom Batch' : 'Customer Dispatch'} #${finalTrackingNumber}`,
        party_name: partyName,
        party_contact: partyContact,
        location: location || "Hyderabad Central Hub",
        sku_list: Array.isArray(skuList) ? skuList : [],
        total_pieces: Number(totalPieces) || 1,
        total_value: Number(totalValue) || 0,
        courier_or_loom_partner: courierOrLoomPartner || (direction === 'inward' ? 'Master Weaver Loom' : 'BlueDart Express'),
        current_stage: currentStage,
        estimated_completion: estimatedCompletion || "In 3-5 days",
        last_update: updateTime,
        notes: notes || null,
        history_timeline: initialHistory,
        updated_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      return successResponse(res, { trackedOrder: data }, "Tracked order registered successfully", 201);
    }

    return successResponse(res, { trackedOrder: req.body }, "Tracked order registered locally", 201);
  } catch (err) {
    console.error("Create tracked order error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 3. ADVANCE TRACKED ORDER STAGE
export async function advanceOrderStage(req, res) {
  try {
    const { id } = req.params;
    const { nextStage, note } = req.body;

    if (!nextStage) {
      return errorResponse(res, "Next stage is required", 400);
    }

    if (supabase) {
      const { data: existing, error: fetchErr } = await supabase
        .from("tracked_orders")
        .select("*")
        .or(`id.eq.${id},tracking_number.eq.${id}`)
        .single();
      if (fetchErr || !existing) return errorResponse(res, "Tracked order not found", 404);

      const timestamp = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const updatedHistory = Array.isArray(existing.history_timeline) ? existing.history_timeline : [];
      updatedHistory.push({
        stage: nextStage,
        timestamp,
        note: note || `Stage advanced to ${nextStage}`,
      });

      const { data, error } = await supabase.from("tracked_orders").update({
        current_stage: nextStage,
        last_update: timestamp,
        history_timeline: updatedHistory,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id).select().single();

      if (error) throw error;
      return successResponse(res, { trackedOrder: data, order: data }, `Stage advanced to ${nextStage}`);
    }

    return successResponse(res, { id, nextStage }, "Stage advanced locally");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

// 4. DELETE TRACKED ORDER
export async function deleteTrackedOrder(req, res) {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error } = await supabase.from("tracked_orders").delete().eq("id", id);
      if (error) throw error;
    }
    return successResponse(res, { id }, "Tracked order removed successfully");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}
