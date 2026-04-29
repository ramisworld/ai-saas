"use client"

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/sidebar";

interface MobileSidebarProps {
    apiLimitCount: number;
    isPro: boolean;
}

const MobileSidebar = ({
    apiLimitCount = 0,
    isPro = false
}: MobileSidebarProps) => {
    return (
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                        <HamburgerMenuIcon />
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Sidebar isPro = {isPro} apiLimitCount={apiLimitCount}/>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default MobileSidebar;
