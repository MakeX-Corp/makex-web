'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams } from 'next/navigation';
import MobileMockup from '@/components/mobile-mockup';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Chat } from '@/components/chat';

interface AppDetails {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function AppEditor() {
  const params = useParams();
  const appId = params.id as string;
  const [app, setApp] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('user_apps')
          .select('*')
          .eq('id', appId)
          .single();

        if (error) throw error;
        setApp(data);
      } catch (error) {
        console.error('Error fetching app details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppDetails();
  }, [appId]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  if (isLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!app) {
    return <div className="container mx-auto p-8">App not found</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-100">
      {/* App Details Header */}
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Edit App: {app.app_name}</h1>
        <div className="text-sm text-gray-600">
          <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
          {app.app_url && <span className="ml-4">URL: {app.app_url}</span>}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        {/* Chat Window */}
        <Card className="w-1/2">
          <CardContent className="p-4 h-full">
            <Chat
              appId={appId}
              appUrl={app.app_url || ""}
            />
          </CardContent>
        </Card>

        {/* Mobile Preview */}
        <Card className="w-1/2 bg-zinc-50">
          <CardContent className="relative h-full flex items-center justify-center p-4">
            <Button 
              size="icon"
              variant="ghost" 
              className="absolute top-4 right-4 z-10"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <MobileMockup>
              <div className="flex flex-col h-full w-full">
                <iframe 
                  key={iframeKey}
                  src={app.app_url || ""}
                  className="w-full h-full rounded-md"
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    minHeight: '500px'
                  }}
                />
              </div>
            </MobileMockup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}