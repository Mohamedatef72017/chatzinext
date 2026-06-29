import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { routeAiRequest } from "@/lib/ai-router";

export async function POST(request: Request) {
  try {
    await requirePermission(permissions.knowledgeManage);

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "الرابط مطلوب." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      return NextResponse.json({ error: "الرابط غير صالح. تأكد من إدخال رابط كامل يبدأ بـ https://" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "يجب أن يبدأ الرابط بـ http:// أو https://" }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChatZiBot/1.0; +https://chatzi.ai)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.9"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: `تعذر تحميل الصفحة: ${response.status} ${response.statusText}` }, { status: 400 });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json({ error: "الرابط لا يحتوي على صفحة HTML قابلة للقراءة." }, { status: 400 });
    }

    const html = await response.text();

    const { load } = await import("cheerio");
    const $ = load(html);

    $("script, style, noscript, nav, footer, header, iframe, svg, [aria-hidden='true'], .cookie-banner, #cookie-banner, .popup, .modal, .advertisement, .ad, .ads").remove();

    const title = $("title").text().trim() || $("h1").first().text().trim() || parsedUrl.hostname;
    const metaDescription = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";

    const textParts: string[] = [];
    
    $("h1, h2, h3, h4").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 2) textParts.push(`\n## ${text}\n`);
    });

    $("p, li, td, th, dd, dt, blockquote, figcaption").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.length > 20) textParts.push(text);
    });

    const rawText = textParts.join("\n").replace(/\n{3,}/g, "\n\n").trim();

    if (rawText.length < 50) {
      return NextResponse.json({ error: "لم يتم العثور على محتوى كافٍ في الصفحة." }, { status: 400 });
    }

    const truncatedText = rawText.slice(0, 30000);

    const aiResult = await routeAiRequest({
      temperature: 0.1,
      systemPrompt: [
        "You are a knowledge extraction specialist for an Arabic/English business CRM.",
        "Extract and structure the key business information from the following webpage content.",
        "Focus on: business description, products/services, pricing, policies, contact info, FAQ, working hours, and any other business-relevant facts.",
        "Remove irrelevant content like navigation links, ads, cookie notices, social media links.",
        "Structure the output clearly with headings and organized sections.",
        "Preserve exact prices, phone numbers, emails, addresses, and dates.",
        "Output in the same language as the content (Arabic or English or both if mixed).",
        "Do not add information that is not in the original content.",
        "Return only the structured knowledge text, no markdown fences or meta-commentary."
      ].join("\n"),
      userInput: `URL: ${parsedUrl.toString()}\nTitle: ${title}\nMeta Description: ${metaDescription}\n\nContent:\n${truncatedText}`
    });

    const extractedText = (aiResult.reply || "").trim();
    if (extractedText.length < 30) {
      return NextResponse.json({ error: "لم يتمكن الذكاء الاصطناعي من استخراج محتوى مفيد من الصفحة." }, { status: 400 });
    }

    return NextResponse.json({
      title: title.slice(0, 200),
      text: extractedText,
      sourceUrl: parsedUrl.toString(),
      wordCount: extractedText.split(/\s+/).length,
      charCount: extractedText.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر جلب بيانات الموقع.";
    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json({ error: "انتهت مهلة تحميل الصفحة. تأكد أن الموقع متاح للعموم." }, { status: 408 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
