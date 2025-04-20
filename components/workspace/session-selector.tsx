import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@radix-ui/react-select";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Hardcoded sample data - would come from props in a real app
const SAMPLE_SESSIONS = [
  { id: "session1", title: "First Session" },
  { id: "session2", title: "Landing Page Design" },
  { id: "session3", title: "API Integration" },
];

export function SessionSelector() {
  const params = useParams();
  const router = useRouter();
  const { appId, sessionId } = params;

  const handleSessionChange = (newSessionId: string) => {
    router.push(`/workspace/${appId}/${newSessionId}`);
  };

  const handleNewSession = () => {
    // In a real app, you would create a new session via API
    // For now, just "create" a hardcoded one and navigate to it
    const newSessionId = "newsession" + Date.now();
    router.push(`/workspace/${appId}/${newSessionId}`);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-64">
        <Select value={sessionId as string} onValueChange={handleSessionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_SESSIONS.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={handleNewSession}>
        <Plus className="mr-2 h-4 w-4" />
        New Session
      </Button>
    </div>
  );
}
