import { currentUser } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";

export async function syncCurrentAppUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    null;

  return prismadb.appUser.upsert({
    where: {
      clerkUserId: user.id,
    },
    create: {
      clerkUserId: user.id,
      email: primaryEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      lastSeenAt: new Date(),
    },
    update: {
      email: primaryEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      lastSeenAt: new Date(),
    },
  });
}
