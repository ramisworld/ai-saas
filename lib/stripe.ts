import Stripe from "stripe";

export function getStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

    if (!secretKey) {
        throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY on the server.");
    }

    return new Stripe(secretKey, {
        apiVersion: "2026-04-22.dahlia",
        typescript: true,
    });
}
