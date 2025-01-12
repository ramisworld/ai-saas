"use client"

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/sidebar";
import { useEffect, useState } from "react";

const MobileSidebar = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger>
                        <Menu />
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetTitle/>
                    <Sidebar />
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default MobileSidebar;