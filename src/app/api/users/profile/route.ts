import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow EMPLOYEE and FREELANCER to access their own profile
        if (session.user.role === "ADMIN" || session.user.role === "MANAGER") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                employeeType: true,
                status: true,
                company: true,
                phone: true,
                address: true,
                hourlyRate: true,
                monthlySalary: true,
                hourlyWage: true,
                hasContract: true,
                contractStatus: true,
                iban: true,
                kvkNumber: true,
                btwNumber: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 