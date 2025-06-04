import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mock time settings
        const settings = {
            workingHoursStart: "08:00",
            workingHoursEnd: "17:00",
            breakDuration: 60, // minutes
            overtimeThreshold: 8, // hours per day
            weekendMultiplier: 1.5,
            eveningMultiplier: 1.25,
            nightMultiplier: 1.5,
            autoBreakDeduction: true,
            minimumShiftDuration: 2, // hours
            maximumShiftDuration: 12 // hours
        };

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error("Error fetching time settings:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Mock update - in real app this would update database
        console.log("Time settings updated:", data);

        return NextResponse.json({
            success: true,
            message: "Time settings updated successfully",
        });
    } catch (error) {
        console.error("Error updating time settings:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
} 