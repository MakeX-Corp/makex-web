"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Create a separate component that uses searchParams
function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  // Move the searchParams inside this component
  // This is now correctly wrapped in a Suspense boundary by the parent
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Verify OTP when component mounts
  useEffect(() => {
    const verifyOtp = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (token_hash && type) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            throw error;
          }

          console.log("OTP verified successfully");
          setVerified(true);
        } catch (error: any) {
          console.error("Error verifying OTP:", error);
          setError("Invalid or expired reset link. Please request a new one.");
        }
      } else {
        setError(
          "Missing verification parameters. Please request a new reset link.",
        );
      }
    };

    verifyOtp();
  }, [searchParams, supabase.auth]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verified) {
      setError("Please wait for verification to complete.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Now this should work because verifyOtp has established a session
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Reset error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-8 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
        Reset Password
      </h1>

      {success ? (
        <div className="bg-green-500/10 text-green-500 text-sm p-3 rounded-lg">
          Your password has been successfully reset. Redirecting to login...
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!verified ? (
            <div className="bg-yellow-500/10 text-yellow-500 text-sm p-3 rounded-lg">
              Verifying your reset link...
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-xl py-2 font-medium disabled:opacity-50 mt-6 hover:bg-primary/90 transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background/95 to-background/90">
      <main className="flex-1 flex items-center justify-center relative z-10">
        <Suspense
          fallback={
            <div className="w-full max-w-md px-8 py-12">
              Loading password reset form...
            </div>
          }
        >
          <PasswordResetForm />
        </Suspense>
      </main>
    </div>
  );
}
