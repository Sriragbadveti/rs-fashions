import { Router } from "express";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// GET all website content & banner images
router.get("/", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from("cms_content").select("*");
      if (error) throw error;
      const formatted = (data || []).reduce((acc, curr) => {
        acc[curr.section_key] = curr;
        return acc;
      }, {});
      return res.json({ success: true, data: formatted });
    }

    return res.json({ success: true, data: inMemoryStore.cms_content });
  } catch (error) {
    console.error("Error fetching CMS content:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET specific section by key (e.g. 'hero_banner', 'festive_banner', 'story_banner')
router.get("/:sectionKey", async (req, res) => {
  try {
    const { sectionKey } = req.params;

    if (supabase) {
      const { data, error } = await supabase.from("cms_content").select("*").eq("section_key", sectionKey).single();
      if (error) return res.status(404).json({ success: false, message: "Section not found" });
      return res.json({ success: true, data });
    }

    const content = inMemoryStore.cms_content[sectionKey];
    if (!content) return res.status(404).json({ success: false, message: "Section not found" });
    return res.json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update website section images & content (Admin CMS)
router.put("/:sectionKey", async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { title, subtitle, badge, image_url, secondary_image_url, link, meta } = req.body;

    if (!image_url) {
      return res.status(400).json({ success: false, message: "image_url is required" });
    }

    const payload = {
      section_key: sectionKey,
      title: title || "",
      subtitle: subtitle || "",
      badge: badge || "",
      image_url,
      secondary_image_url: secondary_image_url || null,
      link: link || "/shop",
      meta: meta || {},
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("cms_content")
        .upsert(payload, { onConflict: "section_key" })
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, message: `Section '${sectionKey}' updated successfully`, data });
    }

    inMemoryStore.cms_content[sectionKey] = {
      ...(inMemoryStore.cms_content[sectionKey] || {}),
      ...payload,
    };

    return res.json({
      success: true,
      message: `Section '${sectionKey}' updated successfully`,
      data: inMemoryStore.cms_content[sectionKey],
    });
  } catch (error) {
    console.error("Error updating CMS section:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
