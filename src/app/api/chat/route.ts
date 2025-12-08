import { NextRequest } from "next/server";
import { Valyu } from "valyu-js";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { OpenAI } from "openai";

const valyuApiKey = process.env.VALYU_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const valyu = valyuApiKey ? new Valyu(valyuApiKey) : new Valyu();
const openai = new OpenAI({ apiKey: openaiApiKey });

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
    const body = await req.json();
    const messages = body?.messages ?? [];
    const useValyu = body?.useValyu !== false; // Default to true if not specified

    // Only require Valyu API key if useValyu is true
    if (useValyu && !valyuApiKey) {
      return Response.json(
        {
          error:
            "VALYU_API_KEY is missing. Set it in .env.local before using this endpoint.",
        },
        { status: 500, headers },
      );
    }

    if (!openaiApiKey) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is missing. Set it in .env.local before using this endpoint.",
        },
        { status: 500, headers },
      );
    }

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

    // Step 1: Use Valyu API to ingest/search for relevant data (only if useValyu is true)
    let ingestedData = "";
    if (useValyu) {
      try {
        // Use Valyu to search and ingest relevant macroeconomic data
        // You can customize this based on your needs - using web search or specific URLs
        const searchTask = await valyu.deepresearch.create({
          input: question,
          model: "lite",
          outputFormats: ["markdown"],
          search: {
            searchType: "web",
          },
        });

        const searchResult = await valyu.deepresearch.wait(searchTask.deepresearch_id!, {
          pollInterval: 5000,
          maxWaitTime: 300000, // 5 minutes for data ingestion
        });

        if (searchResult.status === "completed" && searchResult.output) {
          ingestedData = typeof searchResult.output === "string" 
            ? searchResult.output 
            : JSON.stringify(searchResult.output);
        }
      } catch (valyuError: any) {
        console.error("Valyu data ingestion error:", valyuError);
        // Continue even if Valyu fails - OpenAI can still generate a response
        ingestedData = "Note: Could not retrieve additional data from Valyu API.";
      }
    }

    // Step 2: Use OpenAI API to generate response based on ingested data
    const systemMessage = ingestedData
      ? `${SYSTEM_PROMPT}

RELEVANT DATA FROM VALYU API:
${ingestedData}

Use the above data to inform your response. Cite specific numbers and facts from the data when available.`
      : `${SYSTEM_PROMPT}

Note: You are responding without access to real-time data from Valyu API. Base your response on your training data and general knowledge.`;

    // Build conversation messages for OpenAI
    const openaiMessages: any[] = [
      { role: "system", content: systemMessage },
    ];

    // Add previous messages (excluding the last user message which we'll add separately)
    const previousMessages = messages.slice(0, -1);
    for (const msg of previousMessages) {
      if (msg.role === "user") {
        const text = msg.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("") ?? msg.content ?? "";
        if (text) {
          openaiMessages.push({ role: "user", content: text });
        }
      } else if (msg.role === "assistant") {
        const text = msg.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("") ?? msg.content ?? "";
        if (text) {
          openaiMessages.push({ role: "assistant", content: text });
        }
      }
    }

    // Add the current question
    openaiMessages.push({ role: "user", content: question });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const messageId = crypto.randomUUID();
    const sseBody = new ReadableStream({
      async start(controller) {
        const send = (chunk: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        };

        send({ type: "text-start", id: messageId });

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              send({ type: "text-delta", id: messageId, delta: content });
            }
          }
        } catch (streamError) {
          console.error("OpenAI stream error:", streamError);
          send({ type: "text-delta", id: messageId, delta: "\n\n[Error occurred while streaming response]" });
        }

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
    const isOpenAIError = error?.status === 401 || error?.status === 403;
    const isValyuError = error?.response?.status === 401 || error?.response?.status === 403;
    
    let errorMessage = "Unexpected error while processing the request.";
    let statusCode = 500;

    if (isOpenAIError) {
      errorMessage = "OpenAI API rejected the request (check OPENAI_API_KEY and permissions).";
      statusCode = 502;
    } else if (isValyuError) {
      errorMessage = "Valyu API rejected the request (check VALYU_API_KEY and permissions).";
      statusCode = 502;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return Response.json(
      { error: errorMessage },
      { status: statusCode, headers },
    );
  }
}

