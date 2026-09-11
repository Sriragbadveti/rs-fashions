import { Router } from "express";
import { supabase, inMemoryStore } from "../config/supabase.js";

const router = Router();

// GET all products with optional filters: category, material, minPrice, maxPrice, search, sort
router.get("/", async (req, res) => {
  try {
    const { category, material, minPrice, maxPrice, search, sort } = req.query;

    if (supabase) {
      let query = supabase.from("products").select("*");

      if (category && category !== "All") {
        query = query.eq("category", category);
      }
      if (material && material !== "All") {
        query = query.eq("material", material);
      }
      if (minPrice) {
        query = query.gte("price", Number(minPrice));
      }
      if (maxPrice) {
        query = query.lte("price", Number(maxPrice));
      }
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (sort === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sort === "price_desc") {
        query = query.order("price", { ascending: false });
      } else if (sort === "bestseller") {
        query = query.order("review_count", { ascending: false });
      } else {
        query = query.order("featured", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    // Fallback in-memory
    let items = [...inMemoryStore.products];

    if (category && category !== "All") {
      items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (material && material !== "All") {
      items = items.filter((p) => p.material.toLowerCase() === material.toLowerCase());
    }
    if (minPrice) {
      items = items.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      items = items.filter((p) => p.price <= Number(maxPrice));
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q)
      );
    }

    if (sort === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === "bestseller") {
      items.sort((a, b) => b.review_count - a.review_count);
    } else {
      items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) return res.status(404).json({ success: false, message: "Product not found" });
      return res.json({ success: true, data });
    }

    const item = inMemoryStore.products.find((p) => p.id === id);
    if (!item) return res.status(404).json({ success: false, message: "Product not found" });
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST Add new product (Admin inventory)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      price,
      original_price,
      category,
      material,
      description,
      images,
      colors,
      stock,
      featured,
      rating,
    } = req.body;

    if (!name || !price || !category || !material) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, price, category, material are mandatory",
      });
    }

    const slugId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const newProduct = {
      id: slugId,
      name,
      price: Number(price),
      original_price: original_price ? Number(original_price) : Number(price) * 1.3,
      category,
      material,
      description: description || "Exquisite handwoven luxury saree.",
      images: Array.isArray(images) && images.length ? images : [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop"
      ],
      colors: Array.isArray(colors) && colors.length ? colors : ["Classic"],
      stock: stock !== undefined ? Number(stock) : 10,
      featured: Boolean(featured),
      rating: rating ? Number(rating) : 4.9,
      review_count: 0,
    };

    if (supabase) {
      const { data, error } = await supabase.from("products").insert([newProduct]).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: "Product created successfully", data });
    }

    inMemoryStore.products.unshift(newProduct);
    return res.status(201).json({ success: true, message: "Product created successfully", data: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Update product / stock (Admin inventory)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (supabase) {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return res.json({ success: true, message: "Product updated", data });
    }

    const index = inMemoryStore.products.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Product not found" });

    inMemoryStore.products[index] = { ...inMemoryStore.products[index], ...updates };
    return res.json({ success: true, message: "Product updated", data: inMemoryStore.products[index] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE remove product (Admin inventory)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return res.json({ success: true, message: "Product removed from inventory" });
    }

    const index = inMemoryStore.products.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: "Product not found" });

    inMemoryStore.products.splice(index, 1);
    return res.json({ success: true, message: "Product removed from inventory" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
