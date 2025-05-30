import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        role: "ADMIN" | "MANAGER" | "EMPLOYEE" | "FREELANCER"
        company?: string
    }

    interface Session {
        user: {
            id: string
            role: "ADMIN" | "MANAGER" | "EMPLOYEE" | "FREELANCER"
            company?: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
} 