import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function DiscordSupportButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        variant="default"
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-all"
        onClick={() => window.open("https://discord.gg/qVtpzPY2", "_blank")}
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Get Support
      </Button>
    </div>
  );
}
