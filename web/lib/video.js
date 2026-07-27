// Turns a normal YouTube link (watch, share, or youtu.be) into the embeddable
// format. Returns null for anything it doesn't recognize (Vimeo, direct file,
// placeholder links, etc.) so the caller can fall back to a plain "open" link
// instead of trying to embed something that won't work.
export function toEmbedUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (parsed.hostname.includes("youtube.com") && parsed.pathname.startsWith("/embed/")) {
      return url; // already an embed link
    }
  } catch {
    return null;
  }

  return null;
}
