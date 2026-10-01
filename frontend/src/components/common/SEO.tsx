import { useEffect } from "react";

const SITE_URL = "https://rsfashions25.com";
const SITE_NAME = "RS Fashions";
const DEFAULT_TITLE = "RS Fashions — Authentic Handloom SiCo Gadwal & Silk Sarees";
const DEFAULT_DESCRIPTION =
  "Shop authentic handloom SiCo Gadwal sarees, pure Kanchipuram silks, Kuttu border weaves, and bridal heritage collections at RS Fashions. Thoughtfully chosen artisan drapes shipped across India.";
const DEFAULT_KEYWORDS =
  "RS Fashions, RS Fashions sarees, SiCo Gadwal sarees, pure Gadwal silk sarees, handloom sarees online India, Kuttu border Gadwal saree, zari border sarees, bridal pattu sarees, silk cotton sarees, Gadwal handloom weavers";
const DEFAULT_IMAGE = `${SITE_URL}/saree.png`;

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  image?: string;
  type?: "website" | "product" | "article";
  priceAmount?: number;
  priceCurrency?: string;
  availability?: "instock" | "out of stock";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setOrCreateMeta(attrName: "name" | "property", attrValue: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrCreateLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  priceAmount,
  priceCurrency = "INR",
  availability,
  noindex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`
      : DEFAULT_TITLE;

    const cleanPath = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${SITE_URL}${cleanPath === "/" ? "/" : cleanPath}`;
    const resolvedImage = image?.startsWith("http")
      ? image
      : `${SITE_URL}${image?.startsWith("/") ? image : `/${image}`}`;

    document.title = fullTitle;

    setOrCreateMeta("name", "description", description);
    setOrCreateMeta("name", "keywords", keywords);
    setOrCreateMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    setOrCreateLink("canonical", canonicalUrl);

    // Open Graph
    setOrCreateMeta("property", "og:type", type);
    setOrCreateMeta("property", "og:site_name", SITE_NAME);
    setOrCreateMeta("property", "og:title", fullTitle);
    setOrCreateMeta("property", "og:description", description);
    setOrCreateMeta("property", "og:url", canonicalUrl);
    setOrCreateMeta("property", "og:image", resolvedImage);
    setOrCreateMeta("property", "og:image:alt", fullTitle);
    setOrCreateMeta("property", "og:locale", "en_IN");

    if (priceAmount !== undefined && priceAmount > 0) {
      setOrCreateMeta("property", "product:price:amount", String(priceAmount));
      setOrCreateMeta("property", "product:price:currency", priceCurrency);
    }
    if (availability) {
      setOrCreateMeta("property", "product:availability", availability);
    }

    // Twitter / X Cards
    setOrCreateMeta("name", "twitter:card", "summary_large_image");
    setOrCreateMeta("name", "twitter:title", fullTitle);
    setOrCreateMeta("name", "twitter:description", description);
    setOrCreateMeta("name", "twitter:image", resolvedImage);
    setOrCreateMeta("name", "twitter:image:alt", fullTitle);

    // Dynamic JSON-LD Structured Data
    const scriptId = "rs-fashions-dynamic-jsonld";
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = scriptId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    image,
    type,
    priceAmount,
    priceCurrency,
    availability,
    noindex,
    jsonLd,
  ]);

  return null;
}
