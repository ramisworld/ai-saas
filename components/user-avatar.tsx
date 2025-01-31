import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar";
  
  import { useUser } from "@clerk/nextjs";
  
  export const UserAvatar = () => {
    const { user } = useUser();
  
    return (
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.imageUrl} />
        {/* If the image fails to load, show initials or a placeholder */}
        <AvatarFallback>
          {user?.firstName?.charAt(0)}
          {user?.lastName?.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
  };
  