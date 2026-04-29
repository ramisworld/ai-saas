//created a util to access the database using prisma

import { PrismaClient } from "@prisma/client"

declare global {
    var prisma: PrismaClient | undefined;

}

const cachedPrismaIsCurrent = globalThis.prisma && "appUser" in globalThis.prisma;

const prismadb = cachedPrismaIsCurrent ? globalThis.prisma! : new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb;


export default prismadb
