import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Niet geautoriseerd" },
                { status: 401 }
            );
        }

        // Haal alle projecten op waar de gebruiker aan is toegewezen via ProjectMember
        const assignedProjects = await prisma.project.findMany({
            where: {
                AND: [
                    {
                        status: "ACTIVE"
                    },
                    {
                        assignments: {
                            some: {
                                userId: session.user.id,
                                status: "ACCEPTED"
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                company: true,
                startDate: true,
                endDate: true
            }
        });

        return NextResponse.json(assignedProjects);
    } catch (error) {
        console.error("Error fetching assigned projects:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan bij het ophalen van de projecten" },
            { status: 500 }
        );
    }
} 