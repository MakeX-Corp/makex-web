"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import React from "react";
import QRCode from "qrcode";

type PageParams = {
  id: string;
};

type ShareData = {
  id: number;
  created_at: string;
  app_id: string;
  share_url: string;
  web_url: string;
  app_url: string;
  dub_key: string;
};

export default function SharePage({ params: paramsPromise }: { params: Promise<PageParams> }) {
  const params = React.use(paramsPromise);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deepLinkFailed, setDeepLinkFailed] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const fetchShareData = async () => {
      try {
        const response = await fetch(`/api/share?share_id=${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch share data");
        }
        const data = await response.json();
        setShareData(data);
      } catch (err) {
        setError("Failed to load share data");
        console.error("Error fetching share data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [params.id]);

  useEffect(() => {
    // Detect OS
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);
    const isMobileDevice = isIOSDevice || isAndroidDevice;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    // Detect dark mode
    if (typeof window !== "undefined") {
      setIsDarkMode(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    if (isMobileDevice && shareData?.app_url) {
      // Try deep linking first
      window.location.href = shareData.app_url;

      // Set a timeout to check if deep linking failed
      const timeout = setTimeout(() => {
        setDeepLinkFailed(true);
      }, 2000); // 2 seconds should be enough to determine if deep linking failed

      return () => clearTimeout(timeout);
    }
  }, [isMobile, shareData]);

  useEffect(() => {
    const generateQR = async () => {
      if (shareData?.share_url) {
        try {
          // First generate the QR code
          const dataUrl = await QRCode.toDataURL(shareData.share_url, {
            width: 256,
            margin: 1,
            color: {
              dark: isDarkMode ? "#ffffff" : "#000000",
              light: isDarkMode ? "#000000" : "#ffffff",
            },
            errorCorrectionLevel: "H", // Higher error correction to allow for logo
          });

          // Create a canvas to draw the QR code and logo
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Set canvas size
          canvas.width = 256;
          canvas.height = 256;

          // Load QR code image
          const qrImage = new window.Image();
          qrImage.src = dataUrl;
          await new Promise<void>((resolve) => {
            qrImage.onload = () => resolve();
          });

          // Draw QR code
          ctx.drawImage(qrImage, 0, 0, 256, 256);

          // Load and draw logo
          const logo = new window.Image();
          logo.src = "/logo.png";
          await new Promise<void>((resolve) => {
            logo.onload = () => resolve();
          });

          // Draw circular background for logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(128, 128, 28, 0, 2 * Math.PI, false); // Center (128,128), radius 28
          ctx.fillStyle = isDarkMode ? "#000000" : "#ffffff";
          ctx.shadowColor = "rgba(0,0,0,0.15)";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();

          // Draw logo (smaller, centered)
          const logoSize = 40;
          const logoX = (256 - logoSize) / 2;
          const logoY = (256 - logoSize) / 2;
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          // Convert to data URL
          setQrCodeDataUrl(canvas.toDataURL());
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }
    };

    generateQR();
  }, [shareData?.share_url, isDarkMode]);

  const handleOpenInWeb = () => {
    if (shareData?.web_url) {
      window.location.href = shareData.web_url;
    }
  };

  const handleInstallApp = () => {
    const appStoreUrl = isIOS
      ? "https://testflight.apple.com/join/yuPwpH4t"
      : "https://play.google.com/store/apps/details?id=host.exp.exponent";
    window.location.href = appStoreUrl;
  };

  const handleCopyLink = async () => {
    if (!shareData?.share_url) return;

    try {
      // Try using the Clipboard API first
      await navigator.clipboard.writeText(shareData.share_url);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (err) {
      // Fallback method using a temporary textarea
      const textArea = document.createElement("textarea");
      textArea.value = shareData.share_url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Not Found</h1>
          <p className="text-muted-foreground">The requested share link could not be found.</p>
        </div>
      </div>
    );
  }

  if (isMobile && (deepLinkFailed || !shareData?.app_url)) {
    return (
      <div className="bg-background text-foreground flex flex-col min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
          <Image
            src="/logo.png"
            alt="MakeX Logo"
            width={96}
            height={96}
            className="rounded-2xl mb-6"
            onClick={() => (window.location.href = "https://makex.app")}
            style={{ cursor: "pointer" }}
          />
          <h1 className="text-2xl font-semibold mb-4">
            <a
              href="https://makex.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Built with MakeX
            </a>
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            This is a app made in MakeX. Choose how you'd like to view it:
          </p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={handleOpenInWeb}
              className="w-full bg-primary text-primary-foreground py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Open in Web
            </button>
            <button
              onClick={handleInstallApp}
              className="w-full bg-primary text-primary-foreground py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Image src="/icons/apple-dark.svg" alt="Apple logo" width={20} height={20} />
              Install App for Full Experience
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <Image
            src="/logo.png"
            alt="MakeX Logo"
            width={120}
            height={120}
            className="rounded-2xl mb-6"
            onClick={() => (window.location.href = "https://makex.app")}
            style={{ cursor: "pointer" }}
          />
          <h1 className="text-4xl font-bold mb-4">
            <a
              href="https://makex.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Built with MakeX
            </a>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            This is a app created using MakeX. Scan the QR code with your mobile device to preview
            it, or copy the link to share with others.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Share this app</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span className="text-sm text-muted-foreground flex-1 truncate">
                    {shareData.share_url}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 relative flex items-center justify-center gap-2 bg-foreground text-background py-3 px-5 rounded-lg hover:bg-foreground/90 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                    </svg>
                    {showCopyFeedback ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    onClick={handleOpenInWeb}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Open in Web
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Get the full experience</h2>
              <p className="text-muted-foreground mb-4">
                Install the MakeX app to get the best experience and create your own apps.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://testflight.apple.com/join/yuPwpH4t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Image src="/icons/apple-dark.svg" alt="Apple logo" width={20} height={20} />
                  iOS App
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Image
                    src="/icons/play-store-dark.svg"
                    alt="Play Store logo"
                    width={20}
                    height={20}
                  />
                  Android App
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-card rounded-xl p-8 shadow-sm w-full max-w-sm">
              <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />}
              </div>
              <p className="text-center text-muted-foreground">
                Scan with your phone camera to preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
