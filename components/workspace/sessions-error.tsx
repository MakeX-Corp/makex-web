import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { useRouter } from "next/navigation";

export const SessionsError = ({ sessionsError }: { sessionsError: string }) => {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{sessionsError}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="default" onClick={() => router.push("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
