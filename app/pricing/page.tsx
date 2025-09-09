"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PRICING_PLANS,
  PRICING_COMPARISON_FEATURES,
  PlanProps,
  ComparisonFeature,
} from "@/const";

// Using PlanProps interface from constants

// Using pricing plans from constants
const plans = PRICING_PLANS;

// Using comparison features from constants
const comparisonFeatures = PRICING_COMPARISON_FEATURES;

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (priceId: string) => {
    router.push(`/dashboard/pricing`);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Choose the plan that's right for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${
              plan.popular ? "border-2 border-primary shadow-lg" : ""
            }`}
          >
            <CardHeader>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan?.name !== "Free" && (
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={isLoading === plan.priceId}
                >
                  {isLoading === plan.priceId ? "Processing..." : "Get Started"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}

        {/* Contact Us Card */}
        <Card className="flex flex-col border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl">
              {process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_NAME || "Enterprise"}
            </CardTitle>
            <p className="text-muted-foreground">
              {process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_DESCRIPTION ||
                "Need higher limits? Contact us for custom solutions"}
            </p>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="mb-6">
              <span className="text-4xl font-bold text-muted-foreground">
                Custom
              </span>
            </div>
            <ul className="space-y-2">
              {(
                process.env.NEXT_PUBLIC_ENTERPRISE_PLAN_FEATURES ||
                "Advanced AI editing,Priority support,Custom integrations,Dedicated account manager"
              )
                .split(",")
                .map((feature) => feature.trim())
                .map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              onClick={() =>
                window.open(
                  "mailto:contact@makex.app?subject=Enterprise%20Inquiry",
                  "_blank",
                )
              }
            >
              Contact Us
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-6">Feature</th>
                <th className="text-center py-4 px-6">Free</th>
                <th className="text-center py-4 px-6">Starter</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature) => (
                <tr key={feature.name} className="border-b">
                  <td className="py-4 px-6 font-medium">{feature.name}</td>
                  <td className="py-4 px-6 text-center">
                    {typeof feature.free === "boolean" ? (
                      feature.free ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      feature.free
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {typeof feature.starter === "boolean" ? (
                      feature.starter ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      feature.starter
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
