"use client";

export function AnimatedBackground() {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-500/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-1/4 h-1/4 bg-blue-500/5 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>
  );
}
