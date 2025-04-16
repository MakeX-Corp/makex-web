// pages/api/subscriptions/update.js or app/api/subscriptions/update/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { subscriptionId, priceId, userId } = await request.json();

  if (!subscriptionId || !priceId || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  console.log("subscriptionId", subscriptionId);
  try {
    // Call Paddle API to update the subscription
    const response = await fetch(
      `https://sandbox-api.paddle.com/subscriptions/${subscriptionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              price_id: priceId,
              quantity: 1,
            },
          ],
          proration_billing_mode: "prorated_immediately", // You can change this as needed
        }),
      }
    );
    console.log("response", response);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to update subscription"
      );
    }

    const result = await response.json();

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}
