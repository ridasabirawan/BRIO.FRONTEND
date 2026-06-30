"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import type {
  ToolbarSlot,
  TransformToolbarSlot,
} from "@react-pdf-viewer/toolbar";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { useChat } from "ai/react";
import { Switch } from "@/components/ui/switch";
import { Loader, Bot, SendHorizontal, Maximize2, Minimize2 } from "lucide-react";
import Toggle from "./toggle";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSourceContext } from "./source-context";
import ContentViewer from "./content-viewer";
import SourcesPanel from "./sources-panel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "@/drizzle/queries/select";

const PDFViewer = dynamic<{ pdfUrl: string }>(
  () => import("@/app/chat/[chatbotId]/[chatId]/_components/pdf-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading PDF viewer...</span>
        </div>
      </div>
    ),
  }
);

interface DocumentClientProps {
  userId: string;
  userImage?: string;
  chatbotId: string;
  chatId: string;
}

export default function DocumentClient({
  userId,
  userImage,
  chatbotId,
  chatId,
}: DocumentClientProps) {
  const { currentSource } = useSourceContext();

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});
  const [error, setError] = useState("");
  const [chatOnlyView, setChatOnlyView] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [leftWidth, setLeftWidth] = useState(45); // default 45% left, 55% right
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  const containerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Monitor viewport size for responsive layout changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle panel resizing drag events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      // Constrain panel width between 25% and 75%
      setLeftWidth(Math.max(25, Math.min(75, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const { data, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const messages = await getMessages(chatId);
      return messages.map((msg) => ({
        ...msg,
        role: msg.role as "user" | "system",
      }));
    },
  });

  const {
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    messages,
    isLoading,
  } = useChat({
    api: "/api/chat",
    body: { chatId, chatbotId },
    initialMessages: data || [],
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentMessage = input.trim();
    if (!currentMessage) return;

    await originalHandleSubmit(e);

    queryClient.invalidateQueries({
      queryKey: ["usage", userId],
    });
  };

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Check scroll position and show/hide scroll button
  useEffect(() => {
    const scrollArea = messageListRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const isAtBottom =
        Math.abs(
          scrollArea.scrollHeight -
          scrollArea.scrollTop -
          scrollArea.clientHeight
        ) < 50;
      setShowScrollButton(!isAtBottom);
    };

    scrollArea.addEventListener("scroll", handleScroll);
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && messages) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const defaultProfileIcon = "/user-icon.webp";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Mobile Toggle Layout */}
      <Toggle chatOnlyView={chatOnlyView} setChatOnlyView={setChatOnlyView} />

      {/* Split Workspace View */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex w-full p-2 md:p-3 gap-0 overflow-hidden relative bg-slate-50 dark:bg-zinc-950"
      >
        {/* LEFT: CONTENT VIEWER */}
        {!chatOnlyView && (
          <div
            style={{ width: isMobile ? "100%" : `${leftWidth}%` }}
            className={`h-full flex flex-col min-h-0 overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ${
              currentSource?.type === "pdf"
                ? "border-white/10 bg-[#111113]"
                : "border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900"
            } ${
              isMobile ? (chatOnlyView ? "hidden" : "w-full") : "flex"
            }`}
          >
            {currentSource ? (
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <ContentViewer source={currentSource} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-900/30 text-muted-foreground p-8 text-center">
                <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-3">
                  <Bot className="w-8 h-8 text-violet-500" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">No Document Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Select a knowledge source from the dropdown menu above to read its content.
                </p>
              </div>
            )}
          </div>
        )}

        {/* DRAG-TO-RESIZE DIVIDER (Desktop & Tablet Split View) */}
        {!isMobile && !chatOnlyView && (
          <div
            onMouseDown={handleMouseDown}
            className={`w-2.5 hover:w-3 cursor-col-resize flex items-center justify-center shrink-0 group relative ${
              isDragging ? "bg-transparent" : "bg-transparent"
            }`}
            title="Drag to resize layout"
          >
            {/* The visual line */}
            <div
              className={`w-1 h-[80%] rounded-full transition-colors duration-200 ${
                isDragging
                  ? "bg-violet-500/80"
                  : "bg-slate-200/50 dark:bg-zinc-800/50 group-hover:bg-slate-300 dark:group-hover:bg-zinc-700"
              }`}
            />
          </div>
        )}

        {/* RIGHT: CHAT */}
        <div
          style={{ width: isMobile ? "100%" : `${chatOnlyView ? 100 : 100 - leftWidth}%` }}
          className={`h-full flex flex-col min-h-0 overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/80 rounded-xl shadow-sm ${
            isMobile ? (!chatOnlyView ? "hidden" : "w-full") : "flex"
          }`}
        >
          {/* Messages Scroll Area */}
          <div
            ref={messageListRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {isLoadingMessages ? (
              <div className="flex flex-col justify-center items-center h-full gap-2">
                <Loader className="animate-spin h-6 w-6 text-violet-600" />
                <span className="text-xs text-muted-foreground">Loading chat history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-center p-6 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/10">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Welcome to brio.chat</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me questions about your source documents or anything else you need.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`chatMessage-${index}`}
                  className={`flex items-start gap-4 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  {message.role === "user" ? (
                    <Avatar className="w-8 h-8 shrink-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                      <AvatarImage
                        src={userImage || defaultProfileIcon}
                        alt="User"
                      />
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-semibold">
                        U
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="w-8 h-8 shrink-0 ring-1 ring-violet-100 dark:ring-violet-900/30">
                      <AvatarFallback className="bg-gradient-to-tr from-violet-500 to-indigo-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Bubble */}
                  <div className="flex flex-col max-w-[85%] space-y-1">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm shadow-xs ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs"
                          : "bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/30 dark:border-zinc-700/30 text-slate-800 dark:text-zinc-100 rounded-tl-xs"
                      }`}
                    >
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium text-sky-400 hover:text-sky-500"
                              {...props}
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="leading-relaxed mb-2 last:mb-0" {...props} />
                          ),
                          pre: ({ node, ...props }) => (
                            <pre className="bg-slate-950 dark:bg-black/50 text-slate-100 p-3 rounded-lg overflow-x-auto my-2 text-xs" {...props} />
                          ),
                          code: ({ node, ...props }) => (
                            <code className="bg-slate-200 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 px-1 py-0.5 rounded text-xs" {...props} />
                          ),
                        }}
                        className="prose max-w-none dark:prose-invert prose-slate dark:prose-zinc text-inherit"
                      >
                        {message.content}
                      </ReactMarkdown>

                      {message.role !== "user" && (
                        <SourcesPanel
                          annotations={(message as any).annotations}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="w-8 h-8 shrink-0 ring-1 ring-violet-100 dark:ring-violet-900/30">
                  <AvatarFallback className="bg-gradient-to-tr from-violet-500 to-indigo-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/30 dark:border-zinc-700/30 px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Floating Scroll to Bottom */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[105px] right-6 md:right-8 bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 animate-bounce z-10"
              aria-label="Scroll to bottom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 13l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          )}

          {/* Premium Chat Input Area */}
          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-4 md:py-5 shrink-0">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex flex-col w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500/80 transition-all duration-200 overflow-hidden">
                  <textarea
                    ref={textAreaRef}
                    className="w-full resize-none bg-transparent p-3 pr-12 focus:outline-none text-slate-800 dark:text-zinc-100 text-sm min-h-[50px] max-h-[140px]"
                    disabled={isLoading}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleEnter}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      isLoading ? "Waiting for response..." : "Ask me anything..."
                    }
                  />
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/30 border-t border-slate-100 dark:border-zinc-900">
                    <span className="text-[11px] text-muted-foreground">
                      {input.length}/512 characters
                    </span>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-all duration-200 shadow-xs shrink-0"
                    >
                      {isLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-4 mb-4 p-3 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs flex items-center justify-between">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-500 ml-2 font-medium">Dismiss</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
