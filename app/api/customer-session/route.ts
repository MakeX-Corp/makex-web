import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerId = body.customerId;
    let url = "";
    if (process.env.PADDLE_ENV === "production") {
      url = `https://api.paddle.com/customers/${customerId}/portal-sessions`;
    } else {
      url = `https://sandbox-api.paddle.com/customers/${customerId}/portal-sessions`;
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_SECRET_KEY}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Failed to generate portal link", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({ url: data.data.urls.general.overview });
  } catch (error) {
    console.error("Error generating portal URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
