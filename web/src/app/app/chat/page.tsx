"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerDetail } from "@/components/app/AnswerDetail";
import { DocumentPicker } from "@/components/app/DocumentPicker";
import { ChatIcon, SendIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/Notice";
import { useStoredState } from "@/hooks/useStoredState";
import { RequestFailed, askQuestion } from "@/lib/api";
import { formatWhen, makeId } from "@/lib/format";
import { ALL_DOCUMENTS, SCOPE_KEY } from "@/lib/scope";
import type { ChatMessage } from "@/lib/types";

const OPENERS = [
  "What is the grand total, exactly as written?",
  "List every line item with its amount.",
  "Which vendor issued this, and on what date?",
  "What tax amounts appear anywhere in the document?",
];

/* The thread lives in localStorage, which has a hard quota. Answers carry their
   quoted excerpts, so a long thread gets heavy fast — keep the last 80 turns. */
const MAX_TURNS = 80;

const tail = (messages: ChatMessage[]) =>
  messages.length > MAX_TURNS ? messages.slice(-MAX_TURNS) : messages;

export default function ChatPage() {
  const [messages, setMessages, loaded] = useStoredState<ChatMessage[]>("yellowdoc.thread", []);
  /* Persisted alongside the thread: a scope you chose deliberately should not
     quietly reset to "everything" on the next reload. */
  const [scope, setScope] = useStoredState<string>(SCOPE_KEY, ALL_DOCUMENTS);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  /* Read inside `send` so changing the scope does not rebuild the callback and
     re-render every message bubble. */
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  useEffect(() => () => abort.current?.abort(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const send = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || pending) return;

      setDraft("");
      setPending(true);
      setMessages((current) =>
        tail([...current, { id: makeId(), role: "you", text: query, at: Date.now() }]),
      );

      const controller = new AbortController();
      abort.current = controller;

      try {
        const response = await askQuestion(query, scopeRef.current, controller.signal);
        setMessages((current) =>
          tail([
            ...current,
            {
              id: makeId(),
              role: "yellowdoc",
              text: response.answer,
              detail: {
                query: response.query,
                summary: response.summary ?? "",
                confidence: response.confidence ?? "",
                key_points: response.key_points ?? [],
                examples: response.examples ?? [],
                scope: response.scope ?? null,
                sources: response.sources ?? [],
              },
              at: Date.now(),
            },
          ]),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessages((current) =>
          tail([
            ...current,
            {
              id: makeId(),
              role: "yellowdoc",
              text:
                error instanceof RequestFailed
                  ? [error.message, error.detail].filter(Boolean).join(" ")
                  : "The question could not be sent. Check that the backend is running.",
              at: Date.now(),
              failed: true,
            },
          ]),
        );
      } finally {
        abort.current = null;
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [pending, setMessages],
  );

  return (
    <div className="mx-auto flex min-h-[calc(100dvh_-_9rem)] w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Ask</p>
          <h1 className="t-h2 mt-3">Questions about your documents.</h1>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => setMessages([])}
            disabled={pending}
          >
            Clear thread
          </button>
        ) : null}
      </header>

      <DocumentPicker value={scope} onChange={setScope} disabled={pending} />

      <div className="flex flex-1 flex-col gap-4">
        {loaded && messages.length === 0 && !pending ? (
          <div className="flex flex-col gap-5">
            <EmptyState
              icon={<ChatIcon size={26} />}
              title="Nothing asked yet"
              detail="Answers come only from documents you have converted. If the index is empty, convert something first."
              action={
                <Link href="/app/convert" className="btn btn-outline btn-sm">
                  Convert a document
                </Link>
              }
            />
            <div>
              <p className="label">Try one of these</p>
              <div className="flex flex-wrap gap-2">
                {OPENERS.map((opener) => (
                  <button
                    key={opener}
                    type="button"
                    onClick={() => void send(opener)}
                    className="chip"
                  >
                    {opener}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "you" ? (
            <div key={message.id} className="bubble bubble-you">
              <p className="text-[0.9375rem] leading-snug whitespace-pre-wrap">{message.text}</p>
            </div>
          ) : (
            <div
              key={message.id}
              className={`bubble bubble-yd ${message.failed ? "border-bad/45" : ""}`}
            >
              <p className={`prose-answer ${message.failed ? "text-bad" : ""}`}>{message.text}</p>
              {message.detail ? <AnswerDetail detail={message.detail} /> : null}
              <p className="t-data mt-3 text-fg-3">{formatWhen(message.at)}</p>
            </div>
          ),
        )}

        {pending ? (
          <div className="bubble bubble-yd flex items-center gap-3">
            <span className="typing" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="t-data text-fg-3">
              {scope
                ? `Retrieving passages from ${scope}, then answering from those only`
                : "Retrieving the closest passages, then answering from those only"}
            </span>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
        className="sticky bottom-0 -mx-1 bg-bg pt-3 pb-1"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            placeholder="Ask about an invoice, a total, a date…"
            aria-label="Your question"
            className="input max-h-40 min-h-[3rem] resize-y"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="btn btn-primary h-12 flex-none"
          >
            <SendIcon size={17} />
            <span className="sr-only">Send</span>
          </button>
        </div>
        <p className="t-data mt-2 text-fg-3">
          Enter sends · Shift + Enter adds a line. The thread is kept in this browser only.
        </p>
      </form>
    </div>
  );
}
