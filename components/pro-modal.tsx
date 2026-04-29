"use client"

import { useState } from "react";
import {
    BackpackIcon,
    CardStackIcon,
    CheckIcon,
    FileTextIcon,
    LightningBoltIcon,
    ReaderIcon,
} from "@radix-ui/react-icons";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useProModal } from "@/hooks/use-pro-modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const features = [
    {
      label: "40 application packs/month",
      icon: FileTextIcon,
    },
    {
      label: "Full Career Vault",
      icon: BackpackIcon,
    },
    {
      label: "Interview prep packs",
      icon: ReaderIcon,
    },
    {
      label: "Application tracker",
      icon: CardStackIcon,
    },
  ]

export const ProModal = () => {
    const proModal = useProModal();
    const [loading, setLoading] = useState(false)

    const onSubscribe = async () => {
        try {
          setLoading(true)
          const response = await fetch("/api/stripe");
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || "Billing is not configured.");
          }

          window.location.href = payload.url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Billing is not available.");
        } finally {
            setLoading(false)
        }
    }


    return (
        <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex flex-col items-center justify-center gap-y-4 pb-2">
                        <div className="flex items-center gap-x-2 py-1 font-bold">
                            Upgrade ProofCV
                            <Badge variant="premium" className="uppercase text-sm py-1">
                                pro
                            </Badge>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="space-y-2 pt-2 text-center font-medium text-zinc-900">
                        {features.map((feature) => (
                            <Card
                                key={feature.label}
                                className="flex items-center justify-between border-black/5 p-3"
                            >
                                <div className="flex items-center gap-x-4">
                                    <div className="w-fit rounded-md bg-[#e7f3ec] p-2 text-[#164b3f]">
                                        <feature.icon className="h-5 w-5"/>
                                    </div>
                                    <div className="text-sm font-semibold">
                                        {feature.label}
                                    </div>
                                </div>
                                <CheckIcon className="h-5 w-5 text-primary"/>
                            </Card>
                        ))}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        disabled={loading}
                        onClick={onSubscribe}
                        size="lg"
                        variant="premium"
                        className="w-full"
                    >
                        Upgrade
                        <LightningBoltIcon className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
