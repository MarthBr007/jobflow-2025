import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Niet geautoriseerd" },
                { status: 401 }
            );
        }

        const { projectId, description, isWarehouse } = await request.json();

        if (!isWarehouse && !projectId) {
            return NextResponse.json(
                { error: "Project of warehouse is verplicht" },
                { status: 400 }
            );
        }

        // Als het geen warehouse werk is, controleer of de gebruiker toegang heeft tot het project
        if (!isWarehouse) {
            const hasAccess = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    assignments: {
                        some: {
                            userId: session.user.id,
                            status: "ACCEPTED"
                        }
                    }
                }
            });

            if (!hasAccess) {
                return NextResponse.json(
                    { error: "Je hebt geen toegang tot dit project" },
                    { status: 403 }
                );
            }
        }

        // Controleer of er al een open time entry is
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
            },
        });

        if (existingEntry) {
            return NextResponse.json(
                { error: "Je bent al ingeklokt" },
                { status: 400 }
            );
        }

        // Maak nieuwe time entry
        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                projectId: isWarehouse ? null : projectId,
                description: description || "Geen beschrijving",
                startTime: new Date(),
                isWarehouse: isWarehouse
            },
        });

        // Haal de huidige dag op (vanaf 00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Haal de eerste dag van de week op (maandag)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

        // Bereken de uren van vandaag
        const todayEntries = await prisma.timeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: today,
                },
                endTime: { not: null },
            },
        });

        const todayHours = todayEntries.reduce((acc, entry) => {
            const duration = new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime();
            return acc + duration / (1000 * 60 * 60);
        }, 0);

        // Bereken de uren van deze week
        const weekEntries = await prisma.timeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: startOfWeek,
                },
                endTime: { not: null },
            },
        });

        const weekHours = weekEntries.reduce((acc, entry) => {
            const duration = new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime();
            return acc + duration / (1000 * 60 * 60);
        }, 0);

        return NextResponse.json({
            isClocked: true,
            currentEntry: timeEntry,
            todayHours: Math.round(todayHours * 100) / 100,
            weekHours: Math.round(weekHours * 100) / 100,
        });
    } catch (error) {
        console.error("Error during clock in:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan bij het inklokken" },
            { status: 500 }
        );
    }
} 