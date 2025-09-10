import { task } from "@trigger.dev/sdk";
import { getSupabaseAdmin } from "@/utils/server/supabase-admin";
import { dub } from "@/utils/server/dub";
import { generateAppInfo } from "@/utils/server/generate-app-info";
import { generateAppImageBase64 } from "@/utils/server/generate-app-image";
import { generateShareId } from "@/utils/server/share-id-generator";

export const createExternalListing = task({
  id: "create-external-listing",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: {
    appId: string | null;
    userEmail: string;
    deployData: {
      category: string;
      description: string;
      tags: string[];
      icon: string;
      isPublic: boolean;
      aiGeneratedDetails: boolean;
      aiGeneratedIcon: boolean;
      importUrl?: string;
    };
  }) => {
    console.log(`[CreateExternalListing] Starting external listing creation`);
    const { deployData, userEmail } = payload;
    const supabase = await getSupabaseAdmin();

    if (!deployData.importUrl) {
      throw new Error("Import URL is required for external listings");
    }

    try {
      let category = "";
      let description = "";
      let tags: string[] = [];
      let icon = "";

      // Handle app details generation
      if (deployData.aiGeneratedDetails) {
        console.log(`[CreateExternalListing] Generating app details with AI`);

        const appInfo = await generateAppInfo({
          appName: "external-app",
          displayName: `External App from ${
            new URL(deployData.importUrl).hostname
          }`,
          userPrompt: `Generate app details for an external app located at: ${deployData.importUrl}`,
        });

        category = appInfo.category || "";
        description = appInfo.description || "";
        tags = appInfo.tags || [];
      } else {
        // Use manually provided data
        category = deployData.category || "";
        description = deployData.description || "";
        tags = deployData.tags || [];
      }

      // Handle icon generation
      if (deployData.aiGeneratedIcon) {
        console.log(`[CreateExternalListing] Generating app icon with AI`);

        let imagePrompt = `Create an app icon for: ${
          description ||
          `External app from ${new URL(deployData.importUrl).hostname}`
        }`;

        const appImage = await generateAppImageBase64(imagePrompt);
        icon = appImage || "";
      } else {
        // Use manually provided icon
        icon = deployData.icon !== "ai-generated" ? deployData.icon : "";
      }

      // Generate share ID
      const shareId = await generateShareId(supabase, null);

      // Create display name from URL
      const displayName = `External App - ${
        new URL(deployData.importUrl).hostname
      }`;
      const title = `Check out ${displayName}`;

      // Create Dub link
      const dubLink = await dub.links.create({
        url: `https://makex.app/share/${shareId}`,
        proxy: true,
        domain: "makexapp.link",
        title,
        image: "https://makex.app/share.png",
        description,
      });

      // Insert into app_listing_info
      const result = await supabase.from("app_listing_info").insert({
        app_id: null, // No app_id for external listings
        share_url: dubLink.shortLink || dubLink.url,
        web_url: deployData.importUrl, // The external URL
        app_url: deployData.importUrl, // Same as web_url for external apps
        dub_id: dubLink.id,
        dub_key: dubLink.key,
        share_id: shareId,
        image: icon,
        description: description,
        category: category,
        tags: tags,
        is_public: deployData.isPublic,
        author: userEmail,
        is_external: true, // Mark as external listing
      });

      console.log(
        `[CreateExternalListing] External listing created successfully`,
      );
      return {
        shareUrl: dubLink.shortLink || dubLink.url,
        shareId,
        webUrl: deployData.importUrl,
      };
    } catch (error) {
      console.error(
        "[CreateExternalListing] Error creating external listing:",
        error,
      );
      throw error;
    }
  },
});
