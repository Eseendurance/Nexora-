import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupOptions } from "node:dns";
import { request as httpRequest } from "node:http";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import * as cheerio from "cheerio";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPublicAddress(address: string) {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [first, second, third] = octets;
    return !(
      first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 168 || (second === 0 && (third === 0 || third === 2)))) ||
      (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
      (first === 203 && second === 0 && third === 113)
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) return false;
    const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16);
    return firstGroup >= 0x2000 && firstGroup <= 0x3fff &&
      !normalized.startsWith("2001:db8:");
  }

  return false;
}

async function validatePublicUrl(target: URL): Promise<LookupAddress[]> {
  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    (target.port && !["80", "443"].includes(target.port))
  ) {
    throw new Error("Only public HTTP and HTTPS websites can be researched.");
  }

  const hostname = target.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("The requested website resolves to a non-public network address.");
  }
  return addresses;
}

function requestWithPinnedAddresses(target: URL, addresses: LookupAddress[]) {
  const request = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<import("node:http").IncomingMessage>((resolve, reject) => {
    const pinnedLookup = (
      _hostname: string,
      options: LookupOptions,
      callback: (
        error: NodeJS.ErrnoException | null,
        address: string | LookupAddress[],
        family?: number,
      ) => void,
    ) => {
      const candidates = options.family
        ? addresses.filter(({ family }) => family === options.family)
        : addresses;
      if (candidates.length === 0) {
        callback(new Error("No validated address matches the requested IP family."), "", 0);
      } else if (options.all) {
        callback(null, candidates);
      } else {
        callback(null, candidates[0].address, candidates[0].family);
      }
    };

    const outgoing = request(target, {
      headers: { "User-Agent": "NexoraAI/2.0", Accept: "text/html" },
      lookup: pinnedLookup,
      timeout: 10_000,
    }, resolve);
    outgoing.on("error", reject);
    outgoing.on("timeout", () => outgoing.destroy(new Error("Website request timed out.")));
    outgoing.end();
  });
}

async function fetchWebsiteHtml(initialUrl: string) {
  let target = new URL(initialUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const addresses = await validatePublicUrl(target);
    const response = await requestWithPinnedAddresses(target, addresses);

    if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
      const location = response.headers.location;
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error("The website redirected too many times.");
      }
      target = new URL(location, target);
      continue;
    }
    if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
      response.destroy();
      throw new Error(`Unable to fetch website: ${response.statusCode ?? 500}`);
    }

    const contentType = response.headers["content-type"] ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      response.destroy();
      throw new Error("The requested URL did not return an HTML page.");
    }

    const contentLength = Number(response.headers["content-length"] ?? 0);
    if (contentLength > MAX_HTML_BYTES) {
      response.destroy();
      throw new Error("The website page is too large to analyze.");
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of response) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += bytes.byteLength;
      if (totalBytes > MAX_HTML_BYTES) {
        response.destroy();
        throw new Error("The website page is too large to analyze.");
      }
      chunks.push(bytes);
    }

    return { html: Buffer.concat(chunks).toString("utf8"), url: target.toString() };
  }

  throw new Error("Unable to fetch the requested website.");
}

export async function extractWebsite(url: string) {
  const { html, url: resolvedUrl } = await fetchWebsiteHtml(url);
  const $ = cheerio.load(html);
  $("script, style, nav, footer, iframe, noscript").remove();

  return {
    url: resolvedUrl,
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content")?.trim() ?? "",
    headings: $("h1, h2, h3").map((_, el) => $(el).text().trim()).get().slice(0, 40),
    text: $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000),
    images: $("img").map((_, el) => $(el).attr("src")).get().filter(Boolean).slice(0, 12),
  };
}
