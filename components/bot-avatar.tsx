import { Avatar, AvatarImage } from "@/components/ui/avatar";

export const BotAvatar = () => {
    return (
        <Avatar className="h-8 w-8">
            <AvatarImage className="p-1 src=/logo.png" />
            {/* If the image fails to load, show initials or a placeholder */}
        </Avatar>
    );
}