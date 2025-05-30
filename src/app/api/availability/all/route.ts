import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow admins and managers to view all availability
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current user to filter by company
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { company: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch availability for all users in the same company
        const availability = await prisma.availability.findMany({
            where: {
                user: {
                    company: currentUser.company,
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: [
                { date: "desc" },
                { user: { name: "asc" } }
            ],
        });

        return NextResponse.json(availability);
    } catch (error) {
        console.error("Error fetching all availability:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
} 