"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SupabaseConnect({
  supabaseProject,
  setSupabaseProject,
}: {
  supabaseProject: any;
  setSupabaseProject: any;
}) {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const router = useRouter();

  const steps = [
    "Creating project",
    "Installing Supabase package in project",
    "Setting up environment variables",
  ];

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      setShowCreationModal(true);

      // Simple creation process
      const appId = window.location.pathname.split("/")[2];

      const response = await fetch("/api/integrations/supabase/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      setSupabaseProject(project);

      // Close modal after completion
      setShowCreationModal(false);
      setLoading(false);
    } catch (error) {
      console.error("Error creating project:", error);
      setLoading(false);
      setShowCreationModal(false);
    }
  };

  useEffect(() => {
    const fetchUserIntegrations = async () => {
      try {
        const response = await fetch("/api/integrations/supabase");
        const data = await response.json();
        if (data && data.exists) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error fetching Supabase integration:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchUserIntegrations();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);

      // Generate a random state value for security
      const state = Math.random().toString(36).substring(7);

      // Get the app id from the url
      const appId = window.location.pathname.split("/")[2];

      // Construct the authorization URL
      const authUrl = new URL("https://api.supabase.com/v1/oauth/authorize");
      authUrl.searchParams.append(
        "client_id",
        process.env.NEXT_PUBLIC_SUPABASE_OAUTH_CLIENT_ID!
      );
      authUrl.searchParams.append(
        "redirect_uri",
        `${window.location.origin}/api/integrations/supabase/callback?app_id=${appId}`
      );
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("scope", "read write");

      // Use Next.js router for navigation
      router.push(authUrl.toString());
    } catch (error) {
      console.error("Error initiating OAuth flow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {supabaseProject ? (
          <Button
            onClick={() =>
              window.open(
                `https://supabase.com/dashboard/project/${supabaseProject?.id}`,
                "_blank"
              )
            }
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Image
              src="/supabase-logo-icon.svg"
              alt="Supabase"
              width={20}
              height={20}
            />
            <span className="text-sm font-medium">
              {supabaseProject?.name || "Supabase Project"}
            </span>
          </Button>
        ) : isConnected ? (
          <Button
            onClick={handleCreateProject}
            disabled={loading}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Image
              src="/supabase-logo-icon.svg"
              alt="Supabase"
              width={20}
              height={20}
            />
            {loading ? "Creating Project..." : "Create New Project"}
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={loading || isFetching}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Image
              src="/supabase-logo-icon.svg"
              alt="Supabase"
              width={20}
              height={20}
            />
            {isFetching
              ? "Loading..."
              : loading
              ? "Connecting..."
              : isConnected
              ? "Supabase Connected"
              : "Connect with Supabase"}
          </Button>
        )}
      </div>

      <Dialog open={showCreationModal} onOpenChange={setShowCreationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Creating Supabase Project
            </DialogTitle>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Image src="/logo.png" alt="MakeX" width={40} height={40} />
              <div className="text-xl">+</div>
              <Image
                src="/supabase-logo-icon.svg"
                alt="Supabase"
                width={40}
                height={40}
              />
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step}</div>
                </div>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-r-transparent"></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
