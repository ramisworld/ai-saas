import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { getStripe } from "@/lib/stripe";

export async function GET() {
    try {
      const { userId } = await auth();
      const user = await currentUser();

      if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, {status: 401 })
      }

      if (!process.env.NEXT_PUBLIC_APP_URL) {
        return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
      }

      const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;
      const stripe = getStripe();
      const userSubscription = await prismadb.userSubscription.findUnique({
        where: {
            userId
        }
      });

      if (userSubscription && userSubscription.stripeCustomerId) {
        const stripeSession = await stripe.billingPortal.sessions.create({
            customer: userSubscription.stripeCustomerId,
            return_url: settingsUrl,
        });

        return NextResponse.json({ url: stripeSession.url });
      }

      const priceId = process.env.STRIPE_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID;

      if (!priceId) {
        return NextResponse.json(
          { error: "Stripe checkout is not configured. Add STRIPE_PRICE_ID on the server." },
          { status: 500 }
        );
      }

      const stripeSession = await stripe.checkout.sessions.create({
        success_url: settingsUrl,
        cancel_url: settingsUrl,
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.emailAddresses[0].emailAddress,
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        metadata: {
            userId,
        },
      });

      return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
      console.log("[STRIPE_ERROR]", error);
      return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 })  
    }
}
