import * as cheerio from "cheerio";

export async function extractWebsite(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "NexoraAI/2.0" },
  });

  if (!res.ok) throw new Error(`Unable to fetch website: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, iframe, noscript").remove();

  return {
    url,
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content")?.trim() ?? "",
    headings: $("h1, h2, h3").map((_, el) => $(el).text().trim()).get().slice(0, 40),
    text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000),
    images: $("img").map((_, el) => $(el).attr("src")).get().filter(Boolean).slice(0, 12),
  };
}
