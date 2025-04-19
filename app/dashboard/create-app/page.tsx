// app/dashboard/create-app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateAppPage() {
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleCreate = () => {
    if (appName.trim()) {
      // In a real app, you would add the app to your global state or database
      // For now we'll just navigate back to the dashboard
      router.push("/testing2");

      // In a real app, you would navigate to the new app
      // router.push(`/dashboard/app/${newAppId}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="appName" className="text-sm font-medium">
              App Name
            </label>
            <Input
              id="appName"
              placeholder="My Awesome App"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Input
              id="description"
              placeholder="What this app is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!appName.trim()}>
            Create
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
