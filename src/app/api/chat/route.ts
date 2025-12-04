import { NextRequest } from "next/server";
import { Valyu } from "valyu-js";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

const valyuApiKey = process.env.VALYU_API_KEY;
const valyu = new Valyu(); // Uses VALYU_API_KEY from env

export const runtime = "nodejs";

// Handle OPTIONS request for CORS
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
  try {
    if (!valyuApiKey) {
      return Response.json(
        {
          error:
            "VALYU_API_KEY is missing. Set it in .env.local before using this endpoint.",
        },
        { status: 500, headers },
      );
    }

    const body = await req.json();
    const messages = body?.messages ?? [];

    // Extract text from the last user message (which uses parts format)
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");
    
    const question = lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") ?? body?.input ?? "";

    if (!question || typeof question !== "string") {
      return Response.json(
        { error: "No user question provided." },
        { status: 400, headers },
      );
    }

    const input = `${SYSTEM_PROMPT}

User question:
${question}
`;

    const task = await valyu.deepresearch.create({
      input,
      model: "lite",
      outputFormats: ["markdown"],
      search: {
        searchType: "web",
      },
    });

    const result = await valyu.deepresearch.wait(task.deepresearch_id!, {
      pollInterval: 5000,
      // For demo purposes keep this shorter than production recommendations.
      maxWaitTime: 600000,
    });

    if (result.status !== "completed") {
      return Response.json(
        {
          error:
            result.status === "failed"
              ? result.error ?? "DeepResearch task failed."
              : `DeepResearch task did not complete (status: ${result.status}).`,
        },
        { status: 500, headers },
      );
    }

    const answer =
      (result.output as string | undefined) ??
      "I could not generate a detailed macroeconomic report for this query.";

    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();
    const sseBody = new ReadableStream({
      start(controller) {
        const send = (chunk: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };

        send({ type: "text-start", id: messageId });
        send({ type: "text-delta", id: messageId, delta: answer });
        send({ type: "text-end", id: messageId });
        controller.close();
      },
    });

    return new Response(sseBody, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const valyuStatus = error?.response?.status;
    const isAuthError = valyuStatus === 401 || valyuStatus === 403;
    const statusCode = isAuthError ? 502 : 500;
    return Response.json(
      {
        error: isAuthError
          ? "Valyu API rejected the request (check VALYU_API_KEY and permissions)."
          : error?.message ??
            "Unexpected error while running macroeconomics DeepResearch.",
      },
      { status: statusCode, headers },
    );
  }
}


