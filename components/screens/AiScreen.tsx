"use client";
import { useState, useRef, useEffect, useCallback, memo } from "react";
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
  CreditCard,
  ShoppingBag,
  Fuel,
  Plane,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
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

  const handleSuggestion = useCallback(
    (q: string) => {
      setInput(q);
      // Auto-send after setting input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    },
    []
  );

  const isLastModelMessage = useCallback(
    (msgId: string) => {
      const modelMessages = messages.filter((m) => m.role === "model");
      return modelMessages.length > 0 && modelMessages[modelMessages.length - 1].id === msgId;
    },
    [messages]
  );

  return (
    <div className="flex flex-col h-full min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/60"
        style={{
          background: "linear-gradient(180deg, rgba(10,10,13,0.95) 0%, rgba(10,10,13,0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Sparkles size={17} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
              </div>
              <div>
                <h2 className="font-sora font-bold text-sm leading-tight">
                  AI Card Advisor
                </h2>
                <p className="text-[10px] text-text-muted leading-tight">
                  Powered by Gemini · Google Search
                </p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border/50 transition-all"
              title="New chat"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    isStreaming={isStreaming && isLastModelMessage(msg.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 p-4 bg-danger/8 border border-danger/15 rounded-2xl"
            >
              <AlertCircle
                size={18}
                className="text-danger shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-danger">Error</p>
                <p className="text-xs text-danger/80 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-16 md:bottom-0 border-t border-border/40"
        style={{
          background: "linear-gradient(180deg, rgba(10,10,13,0.85) 0%, rgba(10,10,13,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-3">
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
                    : "Ask me which card to use..."
                }
                disabled={cards.length === 0}
                rows={1}
                className="w-full bg-surface-elevated/80 border border-border/60 rounded-2xl pl-4 pr-4 py-3.5 text-sm resize-none focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted disabled:opacity-40 disabled:cursor-not-allowed no-scrollbar"
                style={{ maxHeight: "150px" }}
              />
            </div>

            <AnimatePresence mode="wait">
              {isStreaming ? (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handleStop}
                  className="shrink-0 w-11 h-11 rounded-2xl bg-danger/90 hover:bg-danger text-white flex items-center justify-center transition-colors shadow-lg shadow-danger/20"
                  title="Stop generating (Esc)"
                >
                  <Square size={14} fill="currentColor" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handleSend}
                  disabled={!input.trim() || cards.length === 0}
                  className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 disabled:shadow-none"
                  title="Send message (Enter)"
                >
                  <Send size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] text-text-muted text-center mt-2 select-none">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated/60 text-text-muted text-[9px] font-mono">Enter</kbd>
            {" "}to send · {" "}
            <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated/60 text-text-muted text-[9px] font-mono">Shift+Enter</kbd>
            {" "}new line · {" "}
            <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated/60 text-text-muted text-[9px] font-mono">Esc</kbd>
            {" "}{isStreaming ? "stop" : "go back"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Empty State — shown when no messages exist
   ═══════════════════════════════════════════ */
function EmptyState({ onSuggestion }: { onSuggestion: (q: string) => void }) {
  const suggestions = [
    {
      icon: ShoppingBag,
      text: "Which card for buying on Amazon?",
      color: "from-orange-500/15 to-amber-500/15",
      iconColor: "text-orange-400",
    },
    {
      icon: CreditCard,
      text: "Best card for grocery shopping?",
      color: "from-emerald-500/15 to-green-500/15",
      iconColor: "text-emerald-400",
    },
    {
      icon: Plane,
      text: "Card with most travel rewards?",
      color: "from-sky-500/15 to-blue-500/15",
      iconColor: "text-sky-400",
    },
    {
      icon: Fuel,
      text: "Best cashback for fuel purchases?",
      color: "from-rose-500/15 to-pink-500/15",
      iconColor: "text-rose-400",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.4 }}
        className="relative mb-8"
      >
        {/* Animated glow ring */}
        <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-violet-500/15 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-sora font-bold mb-2 bg-gradient-to-r from-violet-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent"
      >
        AI Card Advisor
      </motion.h3>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-text-secondary max-w-sm mb-10 leading-relaxed"
      >
        Tell me what you&apos;re buying, and I&apos;ll search for the best
        active card offers to help you save money.
      </motion.p>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestion(s.text)}
            className={`group text-left text-xs p-4 bg-gradient-to-br ${s.color} hover:border-primary/20 border border-border/30 rounded-2xl text-text-secondary hover:text-text-primary transition-all`}
          >
            <div className="flex items-start gap-3">
              <s.icon size={16} className={`${s.iconColor} shrink-0 mt-0.5 transition-transform group-hover:scale-110`} />
              <span className="leading-relaxed">&ldquo;{s.text}&rdquo;</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Message Row — ChatGPT-style full-width rows
   ═══════════════════════════════════════════ */
const MessageRow = memo(function MessageRow({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", duration: 0.35 }}
      className={`group py-5 ${isUser ? "" : ""}`}
    >
      <div className="flex gap-3.5 items-start">
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
          isUser
            ? "bg-primary/10 border border-primary/15"
            : "bg-gradient-to-br from-violet-500/15 to-indigo-600/15 border border-violet-500/10"
        }`}>
          {isUser ? (
            <User size={14} className="text-primary" />
          ) : (
            <Bot size={14} className="text-violet-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Role label */}
          <p className={`text-[11px] font-semibold mb-1.5 ${
            isUser ? "text-primary/70" : "text-violet-400/70"
          }`}>
            {isUser ? "You" : "Tijori AI"}
          </p>

          {message.text ? (
            <div className="text-[13.5px] leading-[1.75] text-text-primary/90 ai-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block w-[3px] h-[18px] bg-violet-400 rounded-full ml-0.5 align-text-bottom animate-blink" />
              )}
            </div>
          ) : (
            <ThinkingIndicator />
          )}
        </div>
      </div>

      {/* Separator */}
      {!isUser && (
        <div className="mt-5 border-b border-border/30" />
      )}
    </motion.div>
  );
});

/* ═══════════════════════════════════════════
   Thinking Indicator — shown before first chunk
   ═══════════════════════════════════════════ */
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-violet-400/60 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">Thinking...</span>
    </div>
  );
}
