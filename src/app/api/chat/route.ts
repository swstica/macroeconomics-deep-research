import { NextRequest } from "next/server";
import { Valyu } from "valyu-js";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { OpenAI } from "openai";

const valyuApiKey = process.env.VALYU_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const useMockData = process.env.USE_MOCK_DATA === "true" || process.env.MOCK_MODE === "true";
const valyu = valyuApiKey ? new Valyu(valyuApiKey) : new Valyu();
const openai = new OpenAI({ apiKey: openaiApiKey });

export const runtime = "nodejs";

// Mock data for testing without API calls
function getMockValyuData(question: string): string {
  return `## Recent Economic Data (as of 2024)

### Federal Reserve Policy
- Current Federal Funds Rate: 5.25-5.50% (as of latest FOMC meeting)
- Inflation target: 2.0%
- Recent policy stance: Maintaining restrictive stance to combat inflation

### Economic Indicators
- GDP Growth (Q4 2023): 3.2% annualized
- Unemployment Rate: 3.7% (latest reading)
- CPI Inflation (YoY): 3.1%
- Core PCE: 2.8%

### Market Data
- 10-Year Treasury Yield: ~4.2%
- Dollar Index (DXY): ~104.5
- S&P 500: ~5,200

### International Context
- Eurozone GDP Growth: 0.5% (Q4 2023)
- China GDP Growth: 5.2% (2023 annual)
- Global inflation trends: Moderating but above central bank targets

*Note: This is mock data for demonstration purposes. Real Valyu API would provide more comprehensive and up-to-date information.*`;
}

function getMockResponse(question: string, useValyu: boolean): string {
  const lowerQuestion = question.toLowerCase();
  
  if (useValyu) {
    // Response with Valyu data
    if (lowerQuestion.includes("fed") || lowerQuestion.includes("rate") || lowerQuestion.includes("interest")) {
      return `## Federal Reserve Policy Impact

Based on current economic data, the Federal Reserve is maintaining a **restrictive monetary policy stance** with the federal funds rate at **5.25-5.50%**.

### Key Factors:

- **Inflation Control**: With CPI at 3.1% and Core PCE at 2.8%, the Fed is balancing between controlling inflation and avoiding excessive economic slowdown
- **Economic Growth**: GDP growth of 3.2% suggests the economy remains resilient despite higher rates
- **Labor Market**: Unemployment at 3.7% indicates a tight labor market, which could contribute to wage pressures

### Potential Effects:

1. **On the Dollar**: Higher interest rates typically strengthen the dollar (DXY ~104.5), making exports more expensive
2. **On Borrowing**: Higher rates increase borrowing costs for businesses and consumers
3. **On Investment**: Higher yields on bonds (10-year at ~4.2%) may attract capital away from riskier assets

*Data sourced from Valyu API - reflects real-time economic indicators.*`;
    }
    
    if (lowerQuestion.includes("inflation") || lowerQuestion.includes("price")) {
      return `## Current Inflation Analysis

Recent data shows **CPI inflation at 3.1% year-over-year**, with **Core PCE at 2.8%**.

### Current Status:

- **Headline Inflation**: 3.1% (above the Fed's 2% target)
- **Core Inflation**: 2.8% (excluding volatile food and energy)
- **Trend**: Moderating from peak levels but still elevated

### Contributing Factors:

1. **Labor Market**: Unemployment at 3.7% suggests tight conditions that could sustain wage growth
2. **Economic Activity**: GDP growth of 3.2% indicates strong demand
3. **Global Context**: Inflation moderating globally but remains above central bank targets

### Policy Implications:

The Federal Reserve is likely to maintain restrictive policy until inflation sustainably returns to the 2% target, balancing this against economic growth concerns.

*Data sourced from Valyu API - includes latest economic indicators.*`;
    }
    
    // Generic response with Valyu data
    return `## Analysis Based on Current Economic Data

Based on recent economic indicators:

### Current Economic Context:

- **GDP Growth**: 3.2% (Q4 2023, annualized)
- **Unemployment**: 3.7%
- **Inflation**: 3.1% (CPI), 2.8% (Core PCE)
- **Fed Funds Rate**: 5.25-5.50%

### Key Observations:

1. The economy shows **resilience** with strong GDP growth despite higher interest rates
2. The labor market remains **tight** with low unemployment
3. Inflation is **moderating** but still above the Fed's 2% target
4. Monetary policy remains **restrictive** to combat inflation

This suggests a balanced economic environment with ongoing policy adjustments to achieve price stability while maintaining growth.

*Data sourced from Valyu API - reflects real-time macroeconomic indicators.*`;
  } else {
    // Response without Valyu data (OpenAI only)
    if (lowerQuestion.includes("fed") || lowerQuestion.includes("rate") || lowerQuestion.includes("interest")) {
      return `## Federal Reserve Policy Overview

The Federal Reserve uses monetary policy tools, primarily the **federal funds rate**, to influence economic activity and inflation.

### General Mechanisms:

- **Rate Increases**: Typically used to cool down an overheating economy and combat inflation
- **Rate Decreases**: Usually employed to stimulate economic activity during downturns
- **Transmission Channels**: Interest rates affect borrowing costs, asset prices, exchange rates, and ultimately spending

### Typical Effects:

1. **On Currency**: Higher rates generally strengthen the dollar
2. **On Investment**: Higher rates increase the cost of capital
3. **On Consumption**: Higher rates make borrowing more expensive, potentially reducing spending

*Note: This response is based on general economic principles. For current data, enable Valyu API mode.*`;
    }
    
    if (lowerQuestion.includes("inflation") || lowerQuestion.includes("price")) {
      return `## Inflation Overview

Inflation refers to the **sustained increase in the general price level** of goods and services over time.

### Key Concepts:

- **Demand-Pull Inflation**: Occurs when aggregate demand exceeds aggregate supply
- **Cost-Push Inflation**: Results from increases in production costs
- **Monetary Inflation**: Can occur when money supply grows faster than economic output

### Measurement:

- **CPI (Consumer Price Index)**: Measures price changes for a basket of consumer goods
- **PCE (Personal Consumption Expenditures)**: Alternative measure preferred by the Fed
- **Core Inflation**: Excludes volatile food and energy prices

### Policy Responses:

Central banks typically raise interest rates to combat inflation by reducing aggregate demand.

*Note: This response is based on general economic knowledge. For current inflation data, enable Valyu API mode.*`;
    }
    
    // Generic response without Valyu data
    return `## Economic Analysis

Based on macroeconomic principles:

### General Framework:

1. **Monetary Policy**: Central banks use interest rates to influence economic activity
2. **Fiscal Policy**: Government spending and taxation affect aggregate demand
3. **Supply Factors**: Productivity, labor markets, and technology drive long-term growth

### Key Relationships:

- **Interest Rates** ↔ **Investment and Consumption**
- **Inflation** ↔ **Monetary Policy Response**
- **Unemployment** ↔ **Economic Growth**

Understanding these relationships helps analyze how policy changes might affect the broader economy.

*Note: This response is based on general economic knowledge. For current data and specific numbers, enable Valyu API mode to get real-time economic indicators.*`;
  }
}

// Simulate streaming with delays
async function* streamMockResponse(text: string) {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? " " : "");
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
  }
}

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

    // MOCK MODE: Return fake data without API calls
    if (useMockData) {
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

      // Simulate Valyu data ingestion delay if useValyu is true
      if (useValyu) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s delay
      }

      const mockResponse = getMockResponse(question, useValyu);

      const encoder = new TextEncoder();
      const messageId = crypto.randomUUID();
      const sseBody = new ReadableStream({
        async start(controller) {
          const send = (chunk: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          };

          send({ type: "text-start", id: messageId });

          // Stream the mock response word by word
          for await (const chunk of streamMockResponse(mockResponse)) {
            send({ type: "text-delta", id: messageId, delta: chunk });
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
    }

    // REAL MODE: Use actual APIs
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

