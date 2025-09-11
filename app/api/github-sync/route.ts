import { NextRequest, NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";
import {
  configureGitHubSync,
  removeGitHubSync,
} from "@/utils/server/freestyle";

export async function POST(request: NextRequest) {
  try {
    const { appId, repoName } = await request.json();

    if (!appId || !repoName) {
      return NextResponse.json(
        { error: "Missing required fields: appId, or repoName" },
        { status: 400 },
      );
    }

    const repoNameRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
    if (!repoNameRegex.test(repoName)) {
      return NextResponse.json(
        { error: "Invalid repository name format. Use: username/repo" },
        { status: 400 },
      );
    }

    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("git_repo_id, github_sync_repo")
      .eq("user_id", user.id)
      .eq("id", appId)
      .single();

    if (appError || !app) {
      console.error("App not found:", appError);
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    if (!app.git_repo_id) {
      return NextResponse.json(
        {
          error:
            "No Git repository found for this app. Please create a repository first.",
        },
        { status: 400 },
      );
    }

    try {
      await configureGitHubSync({
        repoId: app.git_repo_id,
        githubRepoName: repoName,
      });

      const { error: updateError } = await supabase
        .from("user_apps")
        .update({ github_sync_repo: repoName })
        .eq("id", appId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update GitHub sync repo:", updateError);
        return NextResponse.json(
          { error: "Failed to save GitHub sync configuration" },
          { status: 500 },
        );
      }
    } catch (freestyleError) {
      console.error("Freestyle API error:", freestyleError);

      let errorMessage =
        "Failed to configure GitHub sync. Please ensure your GitHub App is installed on the repository.";

      if (freestyleError instanceof Error) {
        const message = freestyleError.message.toLowerCase();
        if (
          message.includes("not yet available") ||
          message.includes("coming soon")
        ) {
          errorMessage =
            "GitHub sync functionality is not yet available. This feature is coming soon!";
        } else if (message.includes("not found") || message.includes("404")) {
          errorMessage =
            "Repository not found. Please check the repository name and ensure it exists.";
        } else if (
          message.includes("permission") ||
          message.includes("access")
        ) {
          errorMessage =
            "Access denied. Please ensure the MakeX Sync GitHub App is installed on the repository.";
        } else if (message.includes("already") || message.includes("exists")) {
          errorMessage =
            "GitHub sync is already configured for this repository.";
        } else if (message.includes("invalid") || message.includes("format")) {
          errorMessage =
            "Invalid repository format. Please use the format: username/repository-name";
        } else if (message.includes("[object object]")) {
          // Handle the case where error is serialized as [object Object]
          errorMessage =
            "GitHub sync configuration failed. Please try again in a few moments.";
        }
      } else if (
        typeof freestyleError === "object" &&
        freestyleError !== null
      ) {
        const errorObj = freestyleError as any;
        if (errorObj.message) {
          errorMessage = `GitHub sync error: ${errorObj.message}`;
        } else if (errorObj.error) {
          errorMessage = `GitHub sync error: ${errorObj.error}`;
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `GitHub sync configured for ${repoName}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GitHub sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: "Missing required field: appId" },
        { status: 400 },
      );
    }

    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("git_repo_id, github_sync_repo")
      .eq("user_id", user.id)
      .eq("id", appId)
      .single();

    if (appError || !app) {
      console.error("App not found:", appError);
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    if (!app.github_sync_repo) {
      return NextResponse.json(
        { error: "No GitHub sync configured for this app" },
        { status: 400 },
      );
    }

    try {
      // Remove GitHub sync from Freestyle API
      await removeGitHubSync({
        repoId: app.git_repo_id,
      });
    } catch (freestyleError) {
      console.error("Freestyle API error:", freestyleError);
    }

    const { error: updateError } = await supabase
      .from("user_apps")
      .update({ github_sync_repo: null })
      .eq("id", appId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to remove GitHub sync repo:", updateError);
      return NextResponse.json(
        { error: "Failed to remove GitHub sync configuration" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `GitHub sync removed for ${app.github_sync_repo}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GitHub sync removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { appId, repoName } = await request.json();

    if (!appId || !repoName) {
      return NextResponse.json(
        { error: "Missing required fields: appId, or repoName" },
        { status: 400 },
      );
    }

    const repoNameRegex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
    if (!repoNameRegex.test(repoName)) {
      return NextResponse.json(
        { error: "Invalid repository name format. Use: username/repo" },
        { status: 400 },
      );
    }

    const result = await getSupabaseWithUser(request);
    if (result instanceof NextResponse) return result;
    if ("error" in result) return result.error;

    const { supabase, user } = result;

    const { data: app, error: appError } = await supabase
      .from("user_apps")
      .select("git_repo_id, github_sync_repo")
      .eq("user_id", user.id)
      .eq("id", appId)
      .single();

    if (appError || !app) {
      console.error("App not found:", appError);
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    if (!app.git_repo_id) {
      return NextResponse.json(
        {
          error:
            "No Git repository found for this app. Please create a repository first.",
        },
        { status: 400 },
      );
    }

    if (app.github_sync_repo) {
      try {
        const res = await removeGitHubSync({
          repoId: app.git_repo_id,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (freestyleError) {
        console.error("Failed to remove old GitHub sync:", freestyleError);
      }
    }

    try {
      await configureGitHubSync({
        repoId: app.git_repo_id,
        githubRepoName: repoName,
      });

      const { error: updateError } = await supabase
        .from("user_apps")
        .update({ github_sync_repo: repoName })
        .eq("id", appId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update GitHub sync repo:", updateError);
        return NextResponse.json(
          { error: "Failed to save GitHub sync configuration" },
          { status: 500 },
        );
      }
    } catch (freestyleError) {
      console.error("Freestyle API error:", freestyleError);

      return NextResponse.json(
        {
          error:
            "Failed to configure GitHub sync. Please ensure your GitHub App is installed on the repository.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `GitHub sync updated to ${repoName}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GitHub sync update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
