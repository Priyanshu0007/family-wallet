"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useCardStore } from "../../store/cardStore";
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  ArrowLeft,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

interface AiScreenProps {
  onBack?: () => void;
}

export default function AiScreen({ onBack }: AiScreenProps) {
  const { cards } = useCardStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Sanitize cards — strip sensitive fields
  const getSanitizedCards = useCallback(() => {
    return cards.map((c) => ({
      bank: c.bank,
      variant: c.variant,
      type: c.type,
      network: c.network,
      holder: c.holder,
    }));
  }, [cards]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "model",
      text: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build history from existing messages (excluding the new ones)
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          cards: getSanitizedCards(),
          history,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Server error: ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, text: accumulated }
              : m
          )
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled — keep partial text
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        // Remove the empty assistant message if we errored before getting any text
        setMessages((prev) =>
          prev.filter(
            (m) =>
              m.id !== assistantMessage.id || m.text.length > 0
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      textareaRef.current?.focus();
    }
  }, [input, isStreaming, messages, getSanitizedCards]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleNewChat = useCallback(() => {
    if (isStreaming) handleStop();
    setMessages([]);
    setError(null);
    setInput("");
    textareaRef.current?.focus();
  }, [isStreaming, handleStop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        if (isStreaming) {
          handleStop();
        } else if (onBack) {
          onBack();
        }
      }
    },
    [handleSend, isStreaming, handleStop, onBack]
  );

  return (
    <div className="flex flex-col h-full min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-surface-elevated transition-colors text-text-secondary hover:text-text-primary"
                title="Go back (Esc)"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-sora font-bold text-sm">
                  AI Card Advisor
                </h2>
                <p className="text-[10px] text-text-muted">
                  Powered by Gemini · Google Search
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="New chat"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(q) => { setInput(q); }} />
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl"
            >
              <AlertCircle
                size={18}
                className="text-danger shrink-0 mt-0.5"
              />
              <p className="text-sm text-danger">{error}</p>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-16 md:bottom-0 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-3">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  cards.length === 0
                    ? "Add cards first to get recommendations..."
                    : "e.g. Which card for buying shoes on Nike?"
                }
                disabled={cards.length === 0}
                rows={1}
                className="w-full bg-surface-elevated border border-border rounded-2xl pl-4 pr-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed no-scrollbar"
                style={{ maxHeight: "120px" }}
              />
            </div>

            {isStreaming ? (
              <button
                onClick={handleStop}
                className="shrink-0 w-11 h-11 rounded-2xl bg-danger/90 hover:bg-danger text-white flex items-center justify-center transition-colors shadow-lg shadow-danger/20"
                title="Stop generating (Esc)"
              >
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() || cards.length === 0}
                className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 disabled:shadow-none"
                title="Send message (Enter)"
              >
                <Send size={16} />
              </button>
            )}
          </div>

          <p className="text-[10px] text-text-muted text-center mt-2">
            Enter to send · Shift+Enter for new line · Esc to{" "}
            {isStreaming ? "stop" : "go back"}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/10 flex items-center justify-center mb-6"
      >
        <Sparkles size={36} className="text-violet-400" />
      </motion.div>
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-sora font-bold mb-2"
      >
        AI Card Advisor
      </motion.h3>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-text-secondary max-w-sm mb-8"
      >
        Tell me what you&apos;re buying, and I&apos;ll search for the best
        active card offers to help you pick the right card.
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md"
      >
        {[
          "Which card for buying on Amazon?",
          "Best card for grocery shopping?",
          "Card with most travel rewards?",
          "Best cashback for fuel purchases?",
        ].map((q, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(q)}
            className="text-left text-xs p-3 bg-surface-elevated/60 hover:bg-surface-elevated border border-border/50 hover:border-primary/20 rounded-xl text-text-secondary hover:text-text-primary transition-all"
          >
            &ldquo;{q}&rdquo;
          </button>
        ))}
      </motion.div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", duration: 0.4 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center mt-1">
          <Bot size={16} className="text-violet-400" />
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? "bg-primary/15 border border-primary/20 text-text-primary"
            : "bg-surface-elevated/80 backdrop-blur-sm border border-border/50 text-text-primary"
        } rounded-2xl px-4 py-3 ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
      >
        {message.text ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words ai-response">
            {message.text}
          </div>
        ) : (
          <TypingIndicator />
        )}
      </div>
      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mt-1">
          <User size={16} className="text-primary" />
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-violet-400/60 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
