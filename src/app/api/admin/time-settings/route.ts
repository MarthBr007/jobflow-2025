import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock data - in a real app this would be stored in a database
let timeSettings = {
    standardWorkDay: 8,
    standardWorkWeek: 40,
    standardStartTime: "08:00",
    standardEndTime: "17:00",
    breakDuration: 30,
    overtimeThreshold: 8.5,
    weekendOvertime: true,
    automaticBreakDeduction: true,
    roundingMinutes: 15,
    timeZone: "Europe/Amsterdam",
    dateFormat: "dd-MM-yyyy",
    timeFormat: "24h",
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(timeSettings);
    } catch (error) {
        console.error("Error fetching time settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !["ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate the data
        if (data.standardWorkDay < 1 || data.standardWorkDay > 24) {
            return NextResponse.json(
                { error: "Standard work day must be between 1 and 24 hours" },
                { status: 400 }
            );
        }

        if (data.standardWorkWeek < 1 || data.standardWorkWeek > 168) {
            return NextResponse.json(
                { error: "Standard work week must be between 1 and 168 hours" },
                { status: 400 }
            );
        }

        if (data.overtimeThreshold < 1 || data.overtimeThreshold > 24) {
            return NextResponse.json(
                { error: "Overtime threshold must be between 1 and 24 hours" },
                { status: 400 }
            );
        }

        if (data.breakDuration < 0 || data.breakDuration > 240) {
            return NextResponse.json(
                { error: "Break duration must be between 0 and 240 minutes" },
                { status: 400 }
            );
        }

        if (data.roundingMinutes < 1 || data.roundingMinutes > 60) {
            return NextResponse.json(
                { error: "Rounding minutes must be between 1 and 60" },
                { status: 400 }
            );
        }

        // Validate time format
        const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timePattern.test(data.standardStartTime) || !timePattern.test(data.standardEndTime)) {
            return NextResponse.json(
                { error: "Invalid time format" },
                { status: 400 }
            );
        }

        // Update the settings (in a real app, save to database)
        timeSettings = {
            ...timeSettings,
            ...data,
        };

        return NextResponse.json({
            success: true,
            message: "Time settings updated successfully",
            settings: timeSettings
        });
    } catch (error) {
        console.error("Error updating time settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 