"use client";

import React from "react";
import { ExternalLink, MessageSquare, HelpCircle, Users, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SupportPage = () => {
  const discordInviteLink = "https://discord.gg/3EsUgb53Zp";
  const email = "contact@makex.app";

  const handleDiscordClick = () => {
    window.open(discordInviteLink, "_blank");
  };

  const handleEmailClick = () => {
    window.open(`mailto:${email}`, "_blank");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md mx-4 shadow-xl border-t-4 border-t-primary">
        <CardContent className="p-0">
          <div className="bg-muted p-6 flex justify-center">
            <div className="bg-primary text-primary-foreground p-4 rounded-full">
              <MessageSquare size={32} />
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Support Center</h1>
              <p className="text-muted-foreground leading-relaxed">
                We're here to help! Choose your preferred way to get support.
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Contact Card */}
              <Card
                className="border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={handleEmailClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Email Support</h3>
                        <p className="text-sm text-muted-foreground">
                          Detailed inquiries and assistance at {email}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              {/* Discord Community Card */}
              <Card
                className="border-2 hover:border-primary/50 transition-all cursor-pointer"
                onClick={handleDiscordClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Discord</h3>
                        <p className="text-sm text-muted-foreground">
                          Quick help from our community
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t border-muted-foreground/20">
              <div className="flex justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>24/7 Community Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Active Community</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                We typically respond to emails within 1 business day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
