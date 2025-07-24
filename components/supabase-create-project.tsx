"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";

export function SupabaseCreateProject() {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserIntegrations = async () => {
      try {
        const appId = window.location.pathname.split("/")[2];

        const response = await fetch(
          `/api/integrations/supabase/projects?appId=${appId}`,
          {
            method: "POST",
            body: JSON.stringify({
              appId: appId,
            }),
          },
        );
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

  const handleCreateProject = async () => {
    try {
      setLoading(true);

      // Get the app id from the url
      const appId = window.location.pathname.split("/")[2];

      const response = await fetch("/api/integrations/supabase/projects", {
        method: "POST",
        body: JSON.stringify({
          appid: appId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      const project = await response.json();
      toast({
        title: "Project Created",
        description: `Successfully created project: ${project.name}`,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) return null;
  if (!isConnected) return null;

  return (
    <Button
      onClick={handleCreateProject}
      disabled={loading}
      className="flex items-center gap-2"
      variant="outline"
    >
      <Image
        src="/supabase-logo-icon.svg"
        alt="Supabase"
        width={20}
        height={20}
      />
      {loading ? "Creating Project..." : "Create Project"}
    </Button>
  );
}
