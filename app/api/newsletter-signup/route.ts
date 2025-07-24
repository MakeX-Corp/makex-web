import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Trigger the waitlist registration task
    await tasks.trigger("email-signup", {
      email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 400 },
    );
  }
}
