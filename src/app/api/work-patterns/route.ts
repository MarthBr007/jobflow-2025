import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const whereClause = activeOnly ? { isActive: true } : {};

        const patterns = await prisma.workPattern.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                totalHoursPerWeek: true,
                workDays: true,
                color: true,
                icon: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Safe JSON parsing function
        const safeParseWorkDays = (workDays: any) => {
            if (typeof workDays === 'string') {
                try {
                    return JSON.parse(workDays);
                } catch (error) {
                    console.error('Error parsing workDays JSON:', error);
                    return []; // Return empty array as fallback
                }
            }
            return workDays || [];
        };

        // Parse workDays JSON if stored as string
        const formattedPatterns = patterns.map(pattern => ({
            ...pattern,
            workDays: safeParseWorkDays(pattern.workDays)
        }));

        return NextResponse.json(formattedPatterns);

    } catch (error) {
        console.error("Error fetching work patterns:", error);
        return NextResponse.json(
            { error: "Failed to fetch work patterns" },
            { status: 500 }
        );
    }
} 