"use client";

export default function WorkspacePage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="text-center p-10 rounded-xl shadow-lg bg-white max-w-md border border-indigo-100">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-indigo-600"
            >
              <path
                d="M15 6L9 12L15 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Select an app to start working on it
        </h2>
        <p className="text-gray-500 mb-6">
          Choose an application from the sidebar to begin your workflow
        </p>
        <div className="flex items-center justify-center">
          <div className="w-8 h-1 rounded-full bg-indigo-100 mx-1"></div>
          <div className="w-8 h-1 rounded-full bg-indigo-100 mx-1"></div>
          <div className="w-8 h-1 rounded-full bg-indigo-100 mx-1"></div>
        </div>
      </div>
    </div>
  );
}
