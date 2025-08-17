"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Database,
  Layout,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Music,
  PenTool,
  Book,
  Users,
  Map,
  CreditCard,
  Mail,
  FileText,
  Video,
  BarChart,
  Globe,
  Search,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CodeRedemption } from "@/components/code-redemption";

// Expanded app suggestion chips for multiple rows with detailed prompts
const APP_SUGGESTIONS = [
  {
    icon: <Layout size={14} />,
    label: "Landing page",
    prompt:
      "Create a modern, responsive landing page with hero section, features overview, pricing plans, testimonials, and contact form. Include smooth animations, mobile-first design, and SEO optimization. The page should convert visitors into customers with clear call-to-action buttons and compelling copy.",
  },
  {
    icon: <ShoppingCart size={14} />,
    label: "E-commerce",
    prompt:
      "Build a full-featured e-commerce platform with product catalog, shopping cart, user authentication, payment processing, order management, and admin dashboard. Include product search, filtering, reviews, wishlist functionality, and responsive design for mobile and desktop users.",
  },
  {
    icon: <Database size={14} />,
    label: "Dashboard",
    prompt:
      "Create a comprehensive admin dashboard with data visualization charts, user management, analytics overview, settings panel, and real-time updates. Include dark/light mode toggle, responsive grid layout, and interactive widgets for monitoring key metrics and system performance.",
  },
  {
    icon: <MessageSquare size={14} />,
    label: "Chat app",
    prompt:
      "Develop a real-time chat application with user authentication, private messaging, group chats, file sharing, and message history. Include typing indicators, online status, push notifications, and a clean interface that works seamlessly across web and mobile devices.",
  },
  {
    icon: <Calendar size={14} />,
    label: "Calendar",
    prompt:
      "Build a feature-rich calendar application with event scheduling, recurring appointments, calendar views (day/week/month), reminder notifications, and calendar sharing. Include drag-and-drop functionality, color coding, and integration with external calendar services.",
  },
  {
    icon: <Code size={14} />,
    label: "Portfolio",
    prompt:
      "Create a professional portfolio website showcasing projects, skills, and experience. Include animated project galleries, skill progress bars, contact forms, blog section, and smooth scrolling navigation. Design should be modern, minimalist, and highlight the developer's work effectively.",
  },
  {
    icon: <ImageIcon size={14} />,
    label: "Photo gallery",
    prompt:
      "Develop an image gallery application with photo upload, album organization, image editing tools, sharing capabilities, and responsive grid layout. Include lightbox viewing, search functionality, tagging system, and social media integration for easy sharing.",
  },
  {
    icon: <Music size={14} />,
    label: "Music player",
    prompt:
      "Build a music streaming application with playlist creation, audio controls, music library management, and user accounts. Include features like shuffle, repeat, equalizer, lyrics display, and recommendations based on listening history. Support multiple audio formats and cross-device synchronization.",
  },
  {
    icon: <PenTool size={14} />,
    label: "Blog",
    prompt:
      "Create a modern blog platform with rich text editor, article management, categories and tags, comment system, and user authentication. Include SEO optimization, social sharing, reading time estimates, related posts, and a clean, readable design that prioritizes content consumption.",
  },
  {
    icon: <Book size={14} />,
    label: "Knowledge base",
    prompt:
      "Develop a comprehensive knowledge base system with article organization, search functionality, user contributions, version control, and interactive tutorials. Include FAQ sections, video content support, user feedback system, and analytics to track popular topics and user engagement.",
  },
  {
    icon: <Users size={14} />,
    label: "Social network",
    prompt:
      "Build a social networking platform with user profiles, friend connections, news feed, post creation, likes and comments, and messaging system. Include privacy settings, content moderation, notification system, and mobile-responsive design for community building and user engagement.",
  },
  {
    icon: <Map size={14} />,
    label: "Travel planner",
    prompt:
      "Create a travel planning application with destination research, itinerary creation, booking management, expense tracking, and travel maps. Include weather information, local recommendations, photo sharing, travel journal, and collaboration features for group trips.",
  },
  {
    icon: <CreditCard size={14} />,
    label: "Finance tracker",
    prompt:
      "Develop a personal finance management app with expense tracking, budget planning, income management, financial goals, and detailed reporting. Include charts and graphs, bill reminders, investment tracking, and secure data storage with encryption for financial privacy.",
  },
  {
    icon: <Mail size={14} />,
    label: "Email client",
    prompt:
      "Build a modern email client with inbox management, email composition, folder organization, search functionality, and contact management. Include email templates, scheduling, read receipts, and integration with popular email services. Focus on clean interface and efficient email workflow.",
  },
  {
    icon: <FileText size={14} />,
    label: "Note taking",
    prompt:
      "Create a comprehensive note-taking application with rich text editing, note organization, search capabilities, collaboration features, and cross-device synchronization. Include markdown support, file attachments, note sharing, and offline access for productivity and knowledge management.",
  },
  {
    icon: <Video size={14} />,
    label: "Video streaming",
    prompt:
      "Develop a video streaming platform with video upload, playback controls, user channels, subscription system, and content discovery. Include video quality options, playlist creation, comments and ratings, and responsive design for watching videos on any device with smooth playback experience.",
  },
  {
    icon: <BarChart size={14} />,
    label: "Analytics",
    prompt:
      "Build a data analytics dashboard with customizable charts, data visualization tools, report generation, and real-time monitoring. Include data import/export, filtering options, user permissions, and interactive dashboards for business intelligence and data-driven decision making.",
  },
  {
    icon: <Globe size={14} />,
    label: "News aggregator",
    prompt:
      "Create a news aggregation application that collects articles from multiple sources, categorizes content, and provides personalized news feeds. Include search functionality, bookmarking, sharing options, and customizable categories. Focus on clean reading experience and efficient content discovery.",
  },
  {
    icon: <Search size={14} />,
    label: "Search engine",
    prompt:
      "Develop a search engine application with web crawling, indexing, and intelligent search algorithms. Include search suggestions, filters, result ranking, and search history. Focus on fast, relevant results with clean interface and advanced search options for comprehensive web search experience.",
  },
  {
    icon: <Briefcase size={14} />,
    label: "Job board",
    prompt:
      "Build a job board platform with job posting, application management, candidate profiles, and employer dashboard. Include job search filters, application tracking, resume uploads, and communication tools. Focus on connecting job seekers with employers efficiently.",
  },
];

// Create three rows of suggestions for animation
const ROW_1 = APP_SUGGESTIONS.slice(0, 7);
const ROW_2 = APP_SUGGESTIONS.slice(7, 14);
const ROW_3 = APP_SUGGESTIONS.slice(14);

// Add these styles to your global CSS file
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes fadeInOut {
      0%,
      100% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes progress {
      0% {
        width: 5%;
      }
      50% {
        width: 70%;
      }
      90% {
        width: 90%;
      }
      100% {
        width: 95%;
      }
    }

    .animate-progress {
      animation: progress 3s ease-in-out infinite;
    }
  `}</style>
);

export default function DashboardPage() {
  const router = useRouter();
  const { createApp, subscription } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [initialPromptLoaded, setInitialPromptLoaded] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

  // Create refs with explicit typing
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check localStorage for initial prompt - only on initial mount
  useEffect(() => {
    if (!initialPromptLoaded) {
      const storedPrompt = localStorage.getItem("makeX_home_prompt");
      if (storedPrompt) {
        // Update the state
        setPrompt(storedPrompt);

        // Clear the localStorage item after retrieving it
        localStorage.removeItem("makeX_home_prompt");

        // Focus the textarea
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
      setInitialPromptLoaded(true);
    }
  }, [initialPromptLoaded]);

  // Animation for moving suggestion pills
  useEffect(() => {
    // Modified the function to accept any ref type and handle null check inside
    const animateRow = (
      rowRef: { current: HTMLDivElement | null },
      direction: "left" | "right",
      speed: number,
    ) => {
      if (!rowRef.current) return;

      let position = 0;
      const row = rowRef.current;
      const rowWidth = row.scrollWidth;
      const viewWidth = row.offsetWidth;

      // Set initial position based on direction
      if (direction === "right") {
        position = -rowWidth / 2;
      }

      const animate = () => {
        if (!row) return;

        // Update position
        if (direction === "left") {
          position -= speed;
          // Reset when enough content has scrolled by
          if (position <= -rowWidth / 2) {
            position = 0;
          }
        } else {
          position += speed;
          // Reset when enough content has scrolled by
          if (position >= 0) {
            position = -rowWidth / 2;
          }
        }

        // Apply the transformation
        row.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    // Start animations for each row with different speeds and directions
    animateRow(row1Ref, "left", 0.3);
    animateRow(row2Ref, "right", 0.2);
    animateRow(row3Ref, "left", 0.3);

    // Cleanup
    return () => {
      // Animation cleanup will happen automatically when component unmounts
    };
  }, []);

  const handleCreateApp = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    setIsCreating(true);
    setCurrentStep(0);

    try {
      // Simulate setup steps while waiting for response
      const steps = [
        "Setting up your files...",
        "Configuring cloud environment...",
        "Warming up AI models...",
        "Finalizing setup...",
      ];

      // Start the step animation
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1000);

      localStorage.setItem("makeX_prompt", prompt);
      const redirectUrl = await createApp(prompt);

      // Clear the interval and redirect
      clearInterval(stepInterval);
      router.push(redirectUrl);
    } catch (error) {
      console.error("Error creating app:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestionClick = (suggestion: (typeof APP_SUGGESTIONS)[0]) => {
    setPrompt(suggestion.prompt);
  };

  const handleUnlimitedChange = (unlimited: boolean) => {
    setIsUnlimited(unlimited);
  };

  // Function to duplicate items for continuous scrolling effect
  const duplicateItemsForScrolling = (items: typeof APP_SUGGESTIONS) => {
    return [...items, ...items];
  };

  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header with logo */}
          <div className="mb-10 text-center">
            <div className="mb-2">
              <Image
                src="/logo.png"
                alt="makeX logo"
                width={128}
                height={32}
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              What do you want to build?
            </h1>

            {/* Code redemption component */}
            <CodeRedemption onUnlimitedChange={handleUnlimitedChange} />
          </div>

          {/* Moving suggestion pills in three rows */}
          <div className="mb-8">
            {/* Row 1 - scrolling left */}
            <div className="overflow-hidden mb-2">
              <div
                ref={row1Ref}
                className="flex whitespace-nowrap"
                style={{ willChange: "transform" }}
              >
                {duplicateItemsForScrolling(ROW_1).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {suggestion.icon}
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2 - scrolling right */}
            <div className="overflow-hidden mb-2">
              <div
                ref={row2Ref}
                className="flex whitespace-nowrap"
                style={{ willChange: "transform" }}
              >
                {duplicateItemsForScrolling(ROW_2).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {suggestion.icon}
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3 - scrolling left */}
            <div className="overflow-hidden">
              <div
                ref={row3Ref}
                className="flex whitespace-nowrap"
                style={{ willChange: "transform" }}
              >
                {duplicateItemsForScrolling(ROW_3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-full border text-sm transition-colors whitespace-nowrap hover:bg-primary/10 hover:border-primary/30"
                  >
                    {suggestion.icon}
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main prompt input */}
          <div className="mb-8">
            <div className="relative border rounded-xl shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your app idea in detail..."
                className="w-full px-6 pt-5 pb-16 resize-none focus:outline-none text-base bg-transparent transition-colors"
                rows={3}
                style={{ minHeight: "120px" }}
              />

              {/* Button area with clean design */}
              <div className="absolute bottom-0 left-0 right-0 py-3 px-4 border-t flex items-center justify-end">
                <div className="flex items-center mr-2">
                  <Sparkles className="h-5 w-5 text-gray-400" />
                </div>

                <Button
                  onClick={handleCreateApp}
                  disabled={!prompt.trim() || isCreating}
                  variant="default"
                  className="font-medium rounded-md flex items-center disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Create App
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {limitReached && (
            <div className="bg-background/5 border rounded-lg p-4 text-center relative">
              <button
                onClick={() => setLimitReached(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <p className="font-medium text-foreground">
                Message limit reached
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className="text-primary cursor-pointer hover:underline"
                  onClick={() => router.push("/dashboard/pricing")}
                >
                  Upgrade your plan
                </span>{" "}
                for more messages
              </p>
            </div>
          )}
        </div>

        <Dialog open={isCreating} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Setting Up Your App
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              {[
                "Setting up your files...",
                "Configuring cloud environment...",
                "Warming up AI models...",
                "Finalizing setup...",
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : index < currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step}</div>
                  </div>
                  {index === currentStep && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-r-transparent"></div>
                  )}
                  {index < currentStep && (
                    <div className="text-primary">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
