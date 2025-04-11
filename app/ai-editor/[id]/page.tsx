'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams } from 'next/navigation';
import MobileMockup from '@/components/mobile-mockup';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Chat } from '@/components/chat';
import { QRCodeDisplay } from '@/components/qr-code';

interface AppDetails {
  id: string;
  user_id: string;
  app_name: string;
  app_url: string | null;
  machine_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AppEditor() {
  const params = useParams();
  const appId = params.id as string;
  const [app, setApp] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContainerLoading, setIsContainerLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'mobile' | 'qr'>('mobile');
  const supabase = createClientComponentClient();

  const wakeContainer = async (appName: string, machineId: string) => {
    setIsContainerLoading(true);
    let timeout = 0;
    try {
      // First check container status
      const statusResponse = await fetch(`/api/machines?app=${appName}&machineId=${machineId}&action=status`, {
        method: 'POST',
      });
      const statusData = await statusResponse.json();

      if (statusData.state === "started") {
        // mark the badge as started
        console.log("Container is already started");

      } 

      if(statusData.state === "stopped") {
        // mark the badge as stopped
        console.log("Container is stopped");
        timeout = 25000;
      }
      if(statusData.state === "suspended") {
        // mark the badge as suspended
        console.log("Container is suspended");
        timeout = 25000;
      }
      else {
        // If not started, wake up the container
        const response = await fetch(`/api/machines?app=${appName}&machineId=${machineId}&action=wait&state=started`, {
          method: 'POST',
        });
        const data = await response.json();
        if (data.ok) {
          await new Promise(resolve => setTimeout(resolve, timeout));
          handleRefresh();
        }
      }
    } catch (error) {
      console.error('Error managing container:', error);
    } finally {
      setIsContainerLoading(false);
    }
  };

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('user_apps')
          .select('*')
          .eq('id', appId)
          .single();

        if (error) throw error;
        if (data.machine_id) {
          wakeContainer(data.app_name, data.machine_id);
        }
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
        <div className="text-sm text-gray-600 flex items-center">
          <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
          {app.app_url && (
            <div className="ml-4 flex items-center gap-2">
              <span>URL: {app.app_url}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => app.app_url && window.open(app.app_url, '_blank')}
                className="h-6 px-2 flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
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

        {/* Preview Section */}
        <Card className="w-1/2 bg-zinc-50">
          <CardContent className="relative h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 border rounded-lg p-1 bg-white">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    viewMode === 'mobile' 
                      ? 'bg-zinc-100 text-zinc-900' 
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Mockup
                </button>
                <button
                  onClick={() => setViewMode('qr')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    viewMode === 'qr' 
                      ? 'bg-zinc-100 text-zinc-900' 
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  View in Mobile
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                  isContainerLoading 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-green-100 text-green-700 border border-green-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isContainerLoading ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  {isContainerLoading ? 'Starting...' : 'Ready'}
                </div>
                <Button 
                  size="icon"
                  variant="ghost" 
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1">
              {viewMode === 'mobile' ? (
                <div className="h-full w-full flex items-center justify-center">
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
                </div>
              ) : (
                <div className="h-full w-full rounded-lg p-4 overflow-auto flex items-center justify-center">
                  <QRCodeDisplay url={(app.app_url || '').replace('https://', 'exp://')} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}