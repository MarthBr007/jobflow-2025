import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock data - in a real app this would be stored in a database
let securitySettings = {
    passwordMinLength: 8,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    allowMultipleSessions: true,
    auditLogging: true,
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !["ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(securitySettings);
    } catch (error) {
        console.error("Error fetching security settings:", error);
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
        if (data.passwordMinLength < 6 || data.passwordMinLength > 20) {
            return NextResponse.json(
                { error: "Password length must be between 6 and 20 characters" },
                { status: 400 }
            );
        }

        if (data.sessionTimeout < 1 || data.sessionTimeout > 168) {
            return NextResponse.json(
                { error: "Session timeout must be between 1 and 168 hours" },
                { status: 400 }
            );
        }

        if (data.maxLoginAttempts < 3 || data.maxLoginAttempts > 10) {
            return NextResponse.json(
                { error: "Max login attempts must be between 3 and 10" },
                { status: 400 }
            );
        }

        // Update the settings (in a real app, save to database)
        securitySettings = {
            ...securitySettings,
            ...data,
        };

        return NextResponse.json({
            success: true,
            message: "Security settings updated successfully",
            settings: securitySettings
        });
    } catch (error) {
        console.error("Error updating security settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 