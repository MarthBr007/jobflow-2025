import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock data - in a real app this would be stored in a database
let companySettings = {
    companyName: "JobFlow Solutions",
    companyDescription: "Complete werknemers en project management oplossing",
    contactEmail: "info@jobflow.nl",
    contactPhone: "+31 20 123 4567",
    website: "https://www.jobflow.nl",
    address: {
        street: "Hoofdstraat 123",
        postalCode: "1234AB",
        city: "Amsterdam",
        country: "Nederland",
    },
    businessInfo: {
        kvkNumber: "12345678",
        btwNumber: "NL123456789B01",
        iban: "NL91ABNA0417164300",
    },
    branding: {
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
        logo: "",
    },
    notifications: {
        systemName: "JobFlow",
        fromEmail: "noreply@jobflow.nl",
        replyToEmail: "support@jobflow.nl",
    },
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(companySettings);
    } catch (error) {
        console.error("Error fetching company settings:", error);
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

        // Validate required fields
        if (!data.companyName || data.companyName.trim().length === 0) {
            return NextResponse.json(
                { error: "Company name is required" },
                { status: 400 }
            );
        }

        if (!data.contactEmail || !isValidEmail(data.contactEmail)) {
            return NextResponse.json(
                { error: "Valid contact email is required" },
                { status: 400 }
            );
        }

        // Validate email addresses in notifications
        if (data.notifications?.fromEmail && !isValidEmail(data.notifications.fromEmail)) {
            return NextResponse.json(
                { error: "Invalid from email address" },
                { status: 400 }
            );
        }

        if (data.notifications?.replyToEmail && !isValidEmail(data.notifications.replyToEmail)) {
            return NextResponse.json(
                { error: "Invalid reply-to email address" },
                { status: 400 }
            );
        }

        // Validate color format
        if (data.branding?.primaryColor && !isValidHexColor(data.branding.primaryColor)) {
            return NextResponse.json(
                { error: "Invalid primary color format" },
                { status: 400 }
            );
        }

        if (data.branding?.secondaryColor && !isValidHexColor(data.branding.secondaryColor)) {
            return NextResponse.json(
                { error: "Invalid secondary color format" },
                { status: 400 }
            );
        }

        // Validate website URL
        if (data.website && !isValidUrl(data.website)) {
            return NextResponse.json(
                { error: "Invalid website URL format" },
                { status: 400 }
            );
        }

        // Update the settings (in a real app, save to database)
        companySettings = {
            ...companySettings,
            ...data,
            address: {
                ...companySettings.address,
                ...data.address,
            },
            businessInfo: {
                ...companySettings.businessInfo,
                ...data.businessInfo,
            },
            branding: {
                ...companySettings.branding,
                ...data.branding,
            },
            notifications: {
                ...companySettings.notifications,
                ...data.notifications,
            },
        };

        return NextResponse.json({
            success: true,
            message: "Company settings updated successfully",
            settings: companySettings
        });
    } catch (error) {
        console.error("Error updating company settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper functions for validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
} 