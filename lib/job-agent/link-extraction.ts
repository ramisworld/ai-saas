import * as cheerio from "cheerio";

const MAX_JOB_PAGE_BYTES = 750_000;

function isPrivateHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export async function extractJobTextFromUrl(url: string) {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return {
      text: "",
      error: "The job link is not a valid URL.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHostname(parsed.hostname)) {
    return {
      text: "",
      error: "Only public http or https job links can be fetched.",
    };
  }

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "ProofCVJobAgent/1.0",
        accept: "text/html, text/plain;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return {
        text: "",
        error: "The job link could not be fetched. Paste the job description instead.",
      };
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return {
        text: "",
        error: "The job link did not return readable text. Paste the job description instead.",
      };
    }

    const html = (await response.text()).slice(0, MAX_JOB_PAGE_BYTES);

    if (contentType.includes("text/plain")) {
      return {
        text: html,
        error: "",
      };
    }

    const $ = cheerio.load(html);
    $("script, style, noscript, svg, nav, footer, header").remove();

    const text = $("body")
      .text()
      .replace(/\s{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      text,
      error: text.length < 200 ? "The job link had very little readable text. Paste the job description for better results." : "",
    };
  } catch {
    return {
      text: "",
      error: "The job link could not be fetched. Paste the job description instead.",
    };
  }
}
