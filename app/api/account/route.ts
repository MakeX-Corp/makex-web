import { NextResponse } from "next/server";
import { getSupabaseWithUser } from "@/utils/server/auth";

export async function DELETE(request: Request) {
  const result = await getSupabaseWithUser(request);
  if (result instanceof NextResponse) return result;

  const { user } = result;

  const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  try {
    const res = await fetch(
      `${SUPABASE_PROJECT_URL}/auth/v1/admin/users/${user.id}`,
      {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
