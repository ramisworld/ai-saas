"use client"

import { Button } from "@/components/ui/button";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import toast from "react-hot-toast";

interface SubscriptionButtonProps {
    isPro: boolean;
}

export const SubscriptionButton = ({
    isPro = false
}: SubscriptionButtonProps) => {
    
    const [loading, setLoading] = useState(false);

    const onClick = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/stripe");
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Billing is not configured.");
            }

            window.location.href = payload.url
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Billing is not available.")
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button disabled={loading} variant={isPro ? "default" : "premium"} onClick={onClick}>
            {isPro ? "Manage Subscription" : "Upgrade"}
            {!isPro && <LightningBoltIcon className="ml-2 h-4 w-4" />}
        </Button>
    )
    
}
