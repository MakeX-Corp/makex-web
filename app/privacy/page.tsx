"use client";

import React from "react";
import { ShieldCheck, UserCheck, Lock, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-3xl mx-4 shadow-xl border-t-4 border-t-primary">
        <CardContent className="p-0">
          <div className="bg-muted p-6 flex justify-center">
            <div className="bg-primary text-primary-foreground p-4 rounded-full">
              <ShieldCheck size={32} />
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
              <p className="text-muted-foreground leading-relaxed">
                This Privacy Policy explains what data we collect, how we use it, and your rights.
                We are committed to transparency and data protection.
              </p>
            </div>

            <div className="space-y-6 text-sm text-muted-foreground">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  1. Information We Collect
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account and Identity Information:</strong> Your email address, full
                    name, profile pictures, authentication credentials, account preferences, and
                    other identifiers you voluntarily provide during sign-up or support.
                  </li>
                  <li>
                    <strong>Service Usage and AI Interaction Data:</strong> This includes your
                    queries and prompts, interaction patterns, usage statistics, session duration,
                    feature engagement, and feedback on AI responses.
                  </li>
                  <li>
                    <strong>Generated Content and Configuration Data:</strong> Content and
                    applications you create, including source code, design settings, deployment
                    configurations, and metadata for personalization and service improvement.
                  </li>
                  <li>
                    <strong>Technical and Device Information:</strong> IP address, browser version,
                    operating system, device identifiers, access logs, time zones, and general
                    device diagnostics.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  2. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Delivery:</strong> To provide and personalize your experience,
                    optimize AI responses, and manage your account.
                  </li>
                  <li>
                    <strong>Analytics & Improvement:</strong> To monitor usage patterns and enhance
                    functionality and performance.
                  </li>
                  <li>
                    <strong>Communication:</strong> For essential updates, customer support, and
                    service-related notifications.
                  </li>
                  <li>
                    <strong>Legal & Security:</strong> To comply with laws, prevent abuse, and
                    safeguard rights and data.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  3. Your Privacy & Rights
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>No Tracking:</strong> We do not track you across apps or websites.
                  </li>
                  <li>
                    <strong>No Third-Party Sharing:</strong> We do not sell or share your data with
                    third parties.
                  </li>
                  <li>
                    <strong>Data Linked to You:</strong> Only your name and email are linked to your
                    identity, solely for account access and functionality.
                  </li>
                  <li>
                    <strong>Data Deletion:</strong> You may request deletion or access to your data
                    at any time.
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-muted-foreground/20">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  4. Contact Us
                </h2>
                <p>
                  If you have questions about your privacy, want to access or delete your data, or
                  need support regarding this policy, you can reach us at:
                </p>
                <p>
                  <strong>Email:</strong> contact@makex.app
                  <br />
                  <strong>Mailing Address:</strong>
                  <br />
                  Privacy Department
                  <br />
                  Bit Wise LLC
                  <br />
                  131 Continental Dr, Suite 305
                  <br />
                  Newark, Delaware 19713
                  <br />
                  United States
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;
