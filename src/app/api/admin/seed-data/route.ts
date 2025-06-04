import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mock seed data operation
        console.log("Seeding data...");

        // Simulate seeding process
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({
            success: true,
            message: "Test data seeded successfully",
            data: {
                users: 10,
                workTypes: 5,
                workPatterns: 3,
                schedules: 25
            }
        });
    } catch (error) {
        console.error("Error seeding data:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
} 