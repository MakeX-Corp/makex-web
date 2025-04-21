export const LoadingSessions = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center max-w-md text-center p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Loading Workspace
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Loading app sessions...
        </p>
        <div className="relative flex justify-center mb-8">
          <div className="absolute w-16 h-16 bg-primary/10 rounded-full animate-ping"></div>
          <div
            className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
