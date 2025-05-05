"use client";

import React from "react";
import { ExternalLink, MessageSquare, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const SupportPage = () => {
  const discordInviteLink = "https://discord.gg/3EsUgb53Zp";

  const handleDiscordClick = () => {
    window.open(discordInviteLink, "_blank");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md mx-4 shadow-xl border-t-4 border-t-primary">
        <CardContent className="p-0">
          <div className="bg-muted p-6 flex justify-center">
            <div className="bg-primary text-primary-foreground p-4 rounded-full">
              <MessageSquare size={32} />
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Need Support?</h1>
              <p className="text-muted-foreground">
                Join our Discord community for fast and friendly support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex flex-col items-center text-center p-3">
                <HelpCircle className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium">Get Help</span>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <Users className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium">Join Community</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                className="w-full flex items-center justify-center gap-2 py-6"
                onClick={handleDiscordClick}
              >
                Join Our Discord
                <ExternalLink size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
