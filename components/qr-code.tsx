'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
}

export function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    if (url) {
      generateQR();
    }

    console.log("the url is", url);
  }, [url]);

  if (!url) {
    return <div className="text-gray-500">No URL available</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {qrCodeDataUrl && (
        <>
          <div className="text-sm text-gray-600 text-center max-w-sm">
            <p className="font-medium mb-2">To view on your mobile device:</p>
            <ol className="text-left space-y-2">
              <li>1. Download <a href="https://expo.dev/client" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Expo Go</a> from your device's app store</li>
              <li>2. Open Expo Go and scan the QR code below</li>
            </ol>
          </div>
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            className="w-64 h-64"
          />
          <p className="text-sm text-gray-600">Scan to view on mobile device</p>
        </>
      )}
    </div>
  );
} 