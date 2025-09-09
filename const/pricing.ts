// Pricing plans and subscription configuration

export interface PlanProps {
  name: string;
  description: string;
  price: string;
  interval: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

// Default pricing plans configuration
export const PRICING_PLANS: PlanProps[] = [
  {
    name: process.env.NEXT_PUBLIC_FREE_PLAN_NAME || "Free",
    description:
      process.env.NEXT_PUBLIC_FREE_PLAN_DESCRIPTION ||
      "For people just starting out",
    price: process.env.NEXT_PUBLIC_FREE_PLAN_PRICE || "0",
    interval: "month",
    features: (
      process.env.NEXT_PUBLIC_FREE_PLAN_FEATURES ||
      "20 messages a month, Slower app start times, Discord support"
    )
      .split(",")
      .map((feature) => feature.trim()),
    priceId: "",
  },
  {
    name: process.env.NEXT_PUBLIC_STARTER_PLAN_NAME || "Starter",
    description:
      process.env.NEXT_PUBLIC_STARTER_PLAN_DESCRIPTION ||
      "Perfect for individuals starting with AI app creation",
    price: process.env.NEXT_PUBLIC_STARTER_PLAN_PRICE || "9.99",
    interval: "month",
    features: (
      process.env.NEXT_PUBLIC_STARTER_PLAN_FEATURES ||
      "250 messages a month,Basic AI editing,Faster app start times,Priority support,Publish to App Store and Google Play (coming soon)"
    )
      .split(",")
      .map((feature) => feature.trim()),
    priceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_ID || "",
    popular: true,
  },
] as const;

// Pricing comparison features interface
export interface ComparisonFeature {
  name: string;
  free: string | boolean;
  starter: string | boolean;
}

// Pricing comparison features
export const PRICING_COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Messages",
    free: "20/month",
    starter: "250/month",
  },
  {
    name: "App Start Times",
    free: "Slower",
    starter: "Faster",
  },
  {
    name: "Support",
    free: "Discord",
    starter: "Priority",
  },
  {
    name: "AI Editing",
    free: false,
    starter: "Basic",
  },
  {
    name: "App Store Publishing",
    free: false,
    starter: "Coming Soon",
  },
] as const;

// Helper functions for plan features and pricing
export const getPlanFeatures = (planName: string): string[] => {
  switch (planName) {
    case "Free":
      return (
        process.env.NEXT_PUBLIC_FREE_PLAN_FEATURES ||
        "20 messages a month, Slower app start times, Discord support"
      )
        .split(",")
        .map((feature) => feature.trim());
    case "Starter":
      return (
        process.env.NEXT_PUBLIC_STARTER_PLAN_FEATURES ||
        "250 messages a month,Basic AI editing,Faster app start times,Priority support,Publish to App Store and Google Play (coming soon)"
      )
        .split(",")
        .map((feature) => feature.trim());
    default:
      return [];
  }
};

export const getPlanPrice = (planName: string): string => {
  switch (planName) {
    case "Free":
      return process.env.NEXT_PUBLIC_FREE_PLAN_PRICE || "0";
    case "Starter":
      return process.env.NEXT_PUBLIC_STARTER_PLAN_PRICE || "9.99";
    default:
      return "0";
  }
};
