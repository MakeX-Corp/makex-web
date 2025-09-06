export const DEFAULT_LIMITS = {
  free: process.env.NODE_ENV === "development" ? 5000 : 5, // 5 messages per day
  starter: 250, // 250 messages per month
  pro: 500, // 500 messages per month
};

export const FOOTER_AND_HEADER_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/login",
  "/signup",
  "/refund",
  "/privacy",
  "/terms",
];
export const APP_CATEGORIES = [
  "Productivity",
  "Social",
  "Gaming",
  "Education",
  "Finance",
  "Health",
  "Entertainment",
  "Developer Tools",
  "Business",
  "Lifestyle",
];

export const CLAUDE_SONNET_4_MODEL = "anthropic/claude-4-sonnet";
export const CLAUDE_3_5_SONNET_LATEST = "claude-3-5-sonnet-latest";

export const APP_SUGGESTIONS = [
  {
    iconName: "Layout",
    label: "Landing page",
    prompt:
      "Create a modern, responsive landing page with hero section, features overview, pricing plans, testimonials, and contact form. Include smooth animations, mobile-first design, and SEO optimization. The page should convert visitors into customers with clear call-to-action buttons and compelling copy.",
  },
  {
    iconName: "ShoppingCart",
    label: "E-commerce",
    prompt:
      "Build a full-featured e-commerce platform with product catalog, shopping cart, user authentication, payment processing, order management, and admin dashboard. Include product search, filtering, reviews, wishlist functionality, and responsive design for mobile and desktop users.",
  },
  {
    iconName: "Database",
    label: "Dashboard",
    prompt:
      "Create a comprehensive admin dashboard with data visualization charts, user management, analytics overview, settings panel, and real-time updates. Include dark/light mode toggle, responsive grid layout, and interactive widgets for monitoring key metrics and system performance.",
  },
  {
    iconName: "MessageSquare",
    label: "Chat app",
    prompt:
      "Develop a real-time chat application with user authentication, private messaging, group chats, file sharing, and message history. Include typing indicators, online status, push notifications, and a clean interface that works seamlessly across web and mobile devices.",
  },
  {
    iconName: "Calendar",
    label: "Calendar",
    prompt:
      "Build a feature-rich calendar application with event scheduling, recurring appointments, calendar views (day/week/month), reminder notifications, and calendar sharing. Include drag-and-drop functionality, color coding, and integration with external calendar services.",
  },
  {
    iconName: "Code",
    label: "Portfolio",
    prompt:
      "Create a professional portfolio website showcasing projects, skills, and experience. Include animated project galleries, skill progress bars, contact forms, blog section, and smooth scrolling navigation. Design should be modern, minimalist, and highlight the developer's work effectively.",
  },
  {
    iconName: "Image",
    label: "Photo gallery",
    prompt:
      "Develop an image gallery application with photo upload, album organization, image editing tools, sharing capabilities, and responsive grid layout. Include lightbox viewing, search functionality, tagging system, and social media integration for easy sharing.",
  },
  {
    iconName: "Music",
    label: "Music player",
    prompt:
      "Build a music streaming application with playlist creation, audio controls, music library management, and user accounts. Include features like shuffle, repeat, equalizer, lyrics display, and recommendations based on listening history. Support multiple audio formats and cross-device synchronization.",
  },
  {
    iconName: "PenTool",
    label: "Blog",
    prompt:
      "Create a modern blog platform with rich text editor, article management, categories and tags, comment system, and user authentication. Include SEO optimization, social sharing, reading time estimates, related posts, and a clean, readable design that prioritizes content consumption.",
  },
  {
    iconName: "Book",
    label: "Knowledge base",
    prompt:
      "Develop a comprehensive knowledge base system with article organization, search functionality, user contributions, version control, and interactive tutorials. Include FAQ sections, video content support, user feedback system, and analytics to track popular topics and user engagement.",
  },
  {
    iconName: "Users",
    label: "Social network",
    prompt:
      "Build a social networking platform with user profiles, friend connections, news feed, post creation, likes and comments, and messaging system. Include privacy settings, content moderation, notification system, and mobile-responsive design for community building and user engagement.",
  },
  {
    iconName: "Map",
    label: "Travel planner",
    prompt:
      "Create a travel planning application with destination research, itinerary creation, booking management, expense tracking, and travel maps. Include weather information, local recommendations, photo sharing, travel journal, and collaboration features for group trips.",
  },
  {
    iconName: "CreditCard",
    label: "Finance tracker",
    prompt:
      "Develop a personal finance management app with expense tracking, budget planning, income management, financial goals, and detailed reporting. Include charts and graphs, bill reminders, investment tracking, and secure data storage with encryption for financial privacy.",
  },
  {
    iconName: "Mail",
    label: "Email client",
    prompt:
      "Build a modern email client with inbox management, email composition, folder organization, search functionality, and contact management. Include email templates, scheduling, read receipts, and integration with popular email services. Focus on clean interface and efficient email workflow.",
  },
  {
    iconName: "FileText",
    label: "Note taking",
    prompt:
      "Create a comprehensive note-taking application with rich text editing, note organization, search capabilities, collaboration features, and cross-device synchronization. Include markdown support, file attachments, note sharing, and offline access for productivity and knowledge management.",
  },
  {
    iconName: "Video",
    label: "Video streaming",
    prompt:
      "Develop a video streaming platform with video upload, playback controls, user channels, subscription system, and content discovery. Include video quality options, playlist creation, comments and ratings, and responsive design for watching videos on any device with smooth playback experience.",
  },
  {
    iconName: "BarChart",
    label: "Analytics",
    prompt:
      "Build a data analytics dashboard with customizable charts, data visualization tools, report generation, and real-time monitoring. Include data import/export, filtering options, user permissions, and interactive dashboards for business intelligence and data-driven decision making.",
  },
  {
    iconName: "Globe",
    label: "News aggregator",
    prompt:
      "Create a news aggregation application that collects articles from multiple sources, categorizes content, and provides personalized news feeds. Include search functionality, bookmarking, sharing options, and customizable categories. Focus on clean reading experience and efficient content discovery.",
  },
  {
    iconName: "Search",
    label: "Search engine",
    prompt:
      "Develop a search engine application with web crawling, indexing, and intelligent search algorithms. Include search suggestions, filters, result ranking, and search history. Focus on fast, relevant results with clean interface and advanced search options for comprehensive web search experience.",
  },
  {
    iconName: "Briefcase",
    label: "Job board",
    prompt:
      "Build a job board platform with job posting, application management, candidate profiles, and employer dashboard. Include job search filters, application tracking, resume uploads, and communication tools. Focus on connecting job seekers with employers efficiently.",
  },
];

// Create three rows of suggestions for animation
export const ROW_1 = APP_SUGGESTIONS.slice(0, 7);
export const ROW_2 = APP_SUGGESTIONS.slice(7, 14);
export const ROW_3 = APP_SUGGESTIONS.slice(14);
