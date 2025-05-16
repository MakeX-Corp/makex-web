import type React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Footer } from "../components/footer";
import { Header } from "../components/header";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "MakeX | Anyone can build",
  description:
    "Create fully functional iOS apps instantly with AI. No coding required.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MakeX",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* External stylesheets and scripts */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
        />
        <script src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"></script>
      </head>
      <body className="overflow-x-hidden antialiased min-h-screen flex flex-col">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Analytics />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

/*

"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import ToolInvocation from "@/components/tool-render";
import { useSession } from "@/context/session-context";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import {
  fetchChatMessages,
  saveAIMessage,
  checkMessageLimit,
} from "@/lib/chat-service";
import { updateSessionTitle } from "@/utils/client/session-utils";
import { ThreeDotsLoader } from "@/components/workspace/three-dots-loader";

interface ChatProps {
  sessionId: string;
  onResponseComplete: () => void;
  onSessionError?: (error: string) => void;
  containerState: string;
}

export function Chat({
  sessionId,
  onResponseComplete,
  onSessionError,
  containerState,
}: ChatProps) {
  const {
    appId,
    apiUrl,
    appName,
    supabaseProject,
    sessionName,
    setSessionName,
    justCreatedSessionId,
  } = useSession();
  const { subscription, isAIResponding, setIsAIResponding } = useApp();
  const router = useRouter();

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [booted, setBooted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storedPrompt, setStoredPrompt] = useState<string | null>(null);
  const [promptChecked, setPromptChecked] = useState(false);
  const injectedPromptRef = useRef(false);

  // 1. Load storedPrompt from localStorage
  useEffect(() => {
    const prompt =
      typeof window !== "undefined"
        ? localStorage.getItem("makeX_prompt")
        : null;
    if (prompt) {
      setStoredPrompt(prompt);
      localStorage.removeItem("makeX_prompt");
    }
    setPromptChecked(true); // ✅ flag that check is done
  }, []);

  // 2. Boot logic: fetch messages only if there's no prompt
  useEffect(() => {
    if (!promptChecked) return;

    const runBoot = async () => {
      if (storedPrompt) {
        setInitialMessages([]);
        setBooted(true);
        return;
      }

      if (!sessionId || !appId || justCreatedSessionId) {
        setInitialMessages([]);
        setBooted(true);
        return;
      }

      setIsLoading(true);
      try {
        const messages = await fetchChatMessages(sessionId, appId);
        setInitialMessages(messages);
      } catch (err) {
        console.error("[Chat Boot] Fetch error:", err);
        onSessionError?.("Failed to fetch messages");
      } finally {
        setIsLoading(false);
        setBooted(true);
      }
    };

    runBoot();
  }, [promptChecked, storedPrompt, sessionId, appId, justCreatedSessionId]);

  // 3. useChat
  const { messages, input, handleInputChange, handleSubmit, error, append } =
    useChat({
      id: sessionId,
      api: `/api/chat/`,
      initialMessages: booted && !storedPrompt ? initialMessages : [],
      body: {
        apiUrl,
        appId,
        appName,
        sessionId,
        supabaseProject,
        subscription,
      },
      maxSteps: 30,
      onResponse: async (response) => {
        if (response.status === 429) {
          setIsAIResponding(false);
        }
      },
      onFinish: async (message, options) => {
        setIsAIResponding(false);
        onResponseComplete();
        try {
          await saveAIMessage(sessionId, appId || "", apiUrl, options, message);
          if (
            messages.length === 0 &&
            message.role === "assistant" &&
            (sessionName === "New Chat" || !sessionName)
          ) {
            const newTitle = await updateSessionTitle(
              messages[0]?.content || "",
              message.content || "",
              sessionId
            );
            if (newTitle) setSessionName(newTitle);
          }

          const result = await checkMessageLimit(subscription);
          if (result) {
            // handle remaining message UI if needed
          }
        } catch (error) {
          console.error("Error saving AI message:", error);
        }
      },
    });

  // 4. Inject prompt once
  useEffect(() => {
    if (storedPrompt && !injectedPromptRef.current && booted) {
      injectedPromptRef.current = true;
      setIsAIResponding(true);
      append({ content: storedPrompt, role: "user" });
    }
  }, [storedPrompt, booted, append, setIsAIResponding]);

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="messages-container h-full overflow-y-auto px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || `message-${index}`}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  <CardContent className="p-4 overflow-hidden">
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      {isAIResponding && <ThreeDotsLoader />}

      <div className="border-t border-border p-4 bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            setIsAIResponding(true);
            handleSubmit(e);
          }}
          className="flex gap-2"
        >
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 resize-none py-2 px-3 rounded-md border"
            rows={1}
          />
          <Button type="submit" size="icon">
            {isAIResponding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}




*/
