"use client";

import { MAKEX_URLS } from "@/const";

export default function WaitlistContainer() {
  return (
    <div className="mb-12 mt-8 relative flex justify-center">
      <a
        href={MAKEX_URLS.APP_STORE}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <img
          src="/app-store.svg"
          alt="Pre-order on the App Store"
          className="h-[62px] w-[180px] md:h-[82px] md:w-[240px]"
        />
      </a>
    </div>
  );
}
