export const ThreeDotsLoader = () => (
  <div className="flex justify-center items-center space-x-1 py-2">
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);
