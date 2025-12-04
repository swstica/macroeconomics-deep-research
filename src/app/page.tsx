"use client";

import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/70 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Valyu Macroeconomics Chatbot
            </h1>
            <p className="text-sm text-zinc-400">
              Ask macro questions. Answers are powered by Valyu DeepResearch.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-zinc-400">
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Welcome to your macroeconomics assistant.
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Try questions like:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  <li>• &quot;How would a Fed rate cut affect the dollar?&quot;</li>
                  <li>
                    • &quot;Compare the 2008 crisis to the COVID recession in
                    macro terms.&quot;
                  </li>
                  <li>
                    • &quot;What are the main channels through which fiscal
                    stimulus raises GDP?&quot;
                  </li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:px-4 sm:py-3 ${
                  message.role === "user"
                    ? "bg-sky-500 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {message.parts
                  ?.filter((part) => part.type === "text")
                  .map((part, i) => (
                    <span key={i}>{part.text}</span>
                  ))}
              </div>
            </div>
          ))}

          {error && (
            <div className="mt-2 rounded-lg border border-red-400 bg-red-950/60 px-3 py-2 text-xs text-red-100">
              <p className="font-medium">Error from backend</p>
              <p className="mt-1 text-red-200">
                {(error as any).message ??
                  "The research API request failed. Please try again or check your API key."}
              </p>
            </div>
          )}

          {isLoading && (
            <div className="mt-2 text-xs text-zinc-400">
              Running deep macro research with Valyu… this can take up to a few
              minutes.
            </div>
          )}
        </div>
      </main>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder="Ask a macroeconomics question…"
            className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:px-4 sm:py-2.5"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-sky-400"
          >
            {isLoading ? "Thinking…" : "Ask"}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-xs text-zinc-500">
          Powered by Valyu DeepResearch. Responses are for educational macro
          analysis only, not investment advice.
        </p>
      </form>
    </div>
  );
}
