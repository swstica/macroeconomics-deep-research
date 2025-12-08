"use client";

import { useState, useRef, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [input, setInput] = useState("");
  const [useValyu, setUseValyu] = useState(true);
  const messageModeMap = useRef<Map<string, boolean>>(new Map());
  const lastUserMessageMode = useRef<boolean>(true);
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ 
      api: "/api/chat",
      body: { useValyu },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Track mode for assistant messages based on the last user message
  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.role === "user") {
        // Store the mode when we see a user message
        messageModeMap.current.set(message.id, lastUserMessageMode.current);
      } else if (message.role === "assistant" && index > 0) {
        // Associate assistant message with previous user message's mode
        const prevMessage = messages[index - 1];
        if (prevMessage?.role === "user") {
          const mode = messageModeMap.current.get(prevMessage.id);
          if (mode !== undefined) {
            messageModeMap.current.set(message.id, mode);
          }
        }
      }
    });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    lastUserMessageMode.current = useValyu;
    await sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/70 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Macroeconomics Research Chatbot
            </h1>
            <p className="text-sm text-zinc-400">
              Compare responses with and without Valyu data ingestion
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${useValyu ? 'text-sky-400' : 'text-zinc-500'}`}>
              Valyu + OpenAI
            </span>
            <button
              type="button"
              onClick={() => setUseValyu(!useValyu)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                useValyu ? 'bg-sky-500' : 'bg-zinc-700'
              }`}
              role="switch"
              aria-checked={useValyu}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useValyu ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-medium ${!useValyu ? 'text-amber-400' : 'text-zinc-500'}`}>
              OpenAI Only
            </span>
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

          {messages.map((message, index) => {
            // Determine if this assistant message was generated with Valyu
            const isValyuMode = messageModeMap.current.get(message.id) ?? 
              (message.role === "assistant" ? useValyu : false);
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col gap-1 max-w-[85%]">
                  {message.role === "assistant" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                      isValyuMode 
                        ? 'bg-sky-500/20 text-sky-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {isValyuMode ? '🔍 Valyu + OpenAI' : '🤖 OpenAI Only'}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed sm:px-4 sm:py-3 ${
                      message.role === "user"
                        ? "bg-sky-500 text-white"
                        : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {message.role === "user" ? (
                      // User messages: plain text
                      message.parts
                        ?.filter((part) => part.type === "text")
                        .map((part, i) => (
                          <span key={i}>{part.text}</span>
                        ))
                    ) : (
                      // Assistant messages: render markdown
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                          // Headings
                          h1: ({ node, ...props }) => (
                            <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0" {...props} />
                          ),
                          // Paragraphs
                          p: ({ node, ...props }) => (
                            <p className="mb-4 last:mb-0 leading-7" {...props} />
                          ),
                          // Lists
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-outside mb-4 ml-6 space-y-2" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-outside mb-4 ml-6 space-y-2" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="leading-7" {...props} />
                          ),
                          // Bold and italic
                          strong: ({ node, ...props }) => (
                            <strong className="font-semibold text-zinc-50" {...props} />
                          ),
                          em: ({ node, ...props }) => (
                            <em className="italic" {...props} />
                          ),
                          // Code blocks
                          code: ({ node, inline, ...props }: any) => {
                            if (inline) {
                              return (
                                <code
                                  className="bg-zinc-700/50 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-200"
                                  {...props}
                                />
                              );
                            }
                            return (
                              <code
                                className="block bg-zinc-900 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4"
                                {...props}
                              />
                            );
                          },
                          pre: ({ node, ...props }) => (
                            <pre className="bg-zinc-900 p-3 rounded-lg overflow-x-auto mb-4" {...props} />
                          ),
                          // Links
                          a: ({ node, ...props }) => (
                            <a
                              className="text-sky-400 hover:text-sky-300 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          // Blockquotes
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className="border-l-4 border-zinc-600 pl-4 italic my-4 text-zinc-300"
                              {...props}
                            />
                          ),
                          // Horizontal rule
                          hr: ({ node, ...props }) => (
                            <hr className="border-zinc-700 my-6" {...props} />
                          ),
                          // Tables
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border-collapse border border-zinc-700" {...props} />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              className="border border-zinc-700 px-4 py-2 bg-zinc-900 font-semibold text-left"
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="border border-zinc-700 px-4 py-2" {...props} />
                          ),
                        }}
                      >
                          {message.parts
                            ?.filter((part) => part.type === "text")
                            .map((part) => part.text)
                            .join("") || ""}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

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
              {useValyu 
                ? "🔍 Ingesting data with Valyu API, then generating response with OpenAI… this can take up to a few minutes."
                : "🤖 Generating response with OpenAI (no data ingestion)…"}
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
          {useValyu 
            ? "🔍 Mode: Valyu API (data ingestion) + OpenAI (response generation)"
            : "🤖 Mode: OpenAI only (no data ingestion)"}
          {" • "}Responses are for educational macro analysis only, not investment advice.
        </p>
      </form>
    </div>
  );
}
