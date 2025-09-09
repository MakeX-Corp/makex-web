"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MAKEX_URLS } from "@/const";

interface QRCodeDisplayProps {
  url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [downloadQrCodeDataUrl, setDownloadQrCodeDataUrl] =
    useState<string>("");
  const [isIOS, setIsIOS] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let expoUrl = isIOS
      ? url.replace("https://", "makex://")
      : url.replace("https://", "exp://");
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(expoUrl, {
          width: 256,
          margin: 1,
          color: {
            dark: theme === "dark" ? "#ffffff" : "#000000",
            light: theme === "dark" ? "#000000" : "#ffffff",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };
    if (url) {
      generateQR();
    }
  }, [url, theme, isIOS]);

  // Generate QR code for app download when modal opens
  useEffect(() => {
    const generateDownloadQR = async () => {
      try {
        const downloadUrl = isIOS
          ? MAKEX_URLS.IOS_DOWNLOAD
          : MAKEX_URLS.ANDROID_DOWNLOAD;
        const dataUrl = await QRCode.toDataURL(downloadUrl, {
          width: 256,
          margin: 1,
          color: {
            dark: theme === "dark" ? "#ffffff" : "#000000",
            light: theme === "dark" ? "#000000" : "#ffffff",
          },
        });
        setDownloadQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error("Error generating download QR code:", err);
      }
    };

    if (isModalOpen) {
      generateDownloadQR();
    }
  }, [isModalOpen, isIOS, theme]);

  const handleDownloadClick = (e: React.MouseEvent, isIOSLink: boolean) => {
    // Check if user is on mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile) {
      // On mobile, let the link work normally
      return;
    }

    // On desktop, prevent default and open modal
    e.preventDefault();
    setIsIOS(isIOSLink);
    setIsModalOpen(true);
  };

  if (!url) {
    return <div className="text-muted-foreground">No URL available</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {qrCodeDataUrl && (
        <>
          <div className="flex items-center bg-muted rounded-lg p-1 mb-2">
            <button
              onClick={() => setIsIOS(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isIOS
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 30 30" fill="currentColor">
                <path d="M25.565,9.785c-0.123,0.077-3.051,1.702-3.051,5.305c0.138,4.109,3.695,5.55,3.756,5.55 c-0.061,0.077-0.537,1.963-1.947,3.94C23.204,26.283,21.962,28,20.076,28c-1.794,0-2.438-1.135-4.508-1.135 c-2.223,0-2.852,1.135-4.554,1.135c-1.886,0-3.22-1.809-4.4-3.496c-1.533-2.208-2.836-5.673-2.882-9 c-0.031-1.763,0.307-3.496,1.165-4.968c1.211-2.055,3.373-3.45,5.734-3.496c1.809-0.061,3.419,1.242,4.523,1.242 c1.058,0,3.036-1.242,5.274-1.242C21.394,7.041,23.97,7.332,25.565,9.785z M15.001,6.688c-0.322-1.61,0.567-3.22,1.395-4.247 c1.058-1.242,2.729-2.085,4.17-2.085c0.092,1.61-0.491,3.189-1.533,4.339C18.098,5.937,16.488,6.872,15.001,6.688z" />
              </svg>
              iOS
            </button>
            <button
              onClick={() => setIsIOS(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                !isIOS
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 50 50" fill="currentColor">
                <path d="M 7.125 2 L 28.78125 23.5 L 34.71875 17.5625 L 8.46875 2.40625 C 8.03125 2.152344 7.5625 2.011719 7.125 2 Z M 5.3125 3 C 5.117188 3.347656 5 3.757813 5 4.21875 L 5 46 C 5 46.335938 5.070313 46.636719 5.1875 46.90625 L 27.34375 24.90625 Z M 36.53125 18.59375 L 30.1875 24.90625 L 36.53125 31.1875 L 44.28125 26.75 C 45.382813 26.113281 45.539063 25.304688 45.53125 24.875 C 45.519531 24.164063 45.070313 23.5 44.3125 23.09375 C 43.652344 22.738281 38.75 19.882813 36.53125 18.59375 Z M 28.78125 26.3125 L 6.9375 47.96875 C 7.300781 47.949219 7.695313 47.871094 8.0625 47.65625 C 8.917969 47.160156 26.21875 37.15625 26.21875 37.15625 L 34.75 32.25 Z" />
              </svg>
              Android
            </button>
          </div>

          <div className="text-sm text-muted-foreground text-center max-w-sm">
            <p className="font-medium mb-2">To view on your mobile device:</p>
            <ol className="text-left space-y-2">
              <li>
                1. Download{" "}
                {isIOS ? (
                  <a
                    href={MAKEX_URLS.IOS_DOWNLOAD}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleDownloadClick(e, true)}
                  >
                    MakeX App
                  </a>
                ) : (
                  <a
                    href={MAKEX_URLS.ANDROID_DOWNLOAD}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleDownloadClick(e, false)}
                  >
                    Expo Go
                  </a>
                )}{" "}
                from your device's app store
              </li>
              <li>2. Open Camera and scan the QR code below</li>
            </ol>
          </div>
          <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
          <p className="text-sm text-muted-foreground">
            Scan to view on mobile device
          </p>
        </>
      )}

      {/* Download Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Download {isIOS ? "MakeX App" : "Expo Go"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                To view this app on your mobile device, you'll need to download
                the app first.
              </p>
            </div>

            {/* QR Code in Modal for App Download */}
            {downloadQrCodeDataUrl && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={downloadQrCodeDataUrl}
                  alt="Download QR Code"
                  className="w-48 h-48"
                />
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">
                    Scan this QR code to download the app
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This will take you to the{" "}
                    {isIOS ? "App Store" : "Google Play Store"}
                  </p>
                </div>
              </div>
            )}

            {/* Download Instructions */}
            <div className="text-sm text-muted-foreground text-center max-w-sm">
              <p className="font-medium mb-2">How to get the app:</p>
              <ol className="text-left space-y-2">
                <li>1. On your mobile device, scan the QR code above</li>
                <li>
                  2. Or search for "{isIOS ? "MakeX App" : "Expo Go"}" in your
                  app store
                </li>
                <li>3. Download and install the app</li>
                <li>
                  4. Once installed, come back and scan the app QR code to view
                  your app
                </li>
              </ol>
            </div>

            {/* Direct Download Links */}
            <div className="flex gap-2 w-full">
              <a
                href={
                  isIOS ? MAKEX_URLS.IOS_DOWNLOAD : MAKEX_URLS.ANDROID_DOWNLOAD
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
              >
                Download {isIOS ? "MakeX App" : "Expo Go"}
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
