import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { getApiLimitCount } from "@/lib/api-limit";
import { syncCurrentAppUser } from "@/lib/app-user";
import { checkSubscription } from "@/lib/subscription";

const DashboardLayout = async ({ 
    children 
}: {
    children: React.ReactNode;
}) => {
    await syncCurrentAppUser();

    const apiLimitCount = await getApiLimitCount();
    const isPro = await checkSubscription();

    return (
        <div className="min-h-dvh bg-background">
            <div className="hidden h-full md:flex md:w-72
            md:flex-col md:fixed md:inset-y-0
            bg-[#111512]">
                <Sidebar isPro={isPro} apiLimitCount={apiLimitCount}/>
             </div>
             <main className="md:pl-72">
                <Navbar />
                {children}
             </main>
        </div>
        
    );
}

export default DashboardLayout;

  
