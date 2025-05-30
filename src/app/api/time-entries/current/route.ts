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

        // Haal de huidige dag op (vanaf 00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Haal de eerste dag van de week op (maandag)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

        // Zoek de huidige open time entry
        const currentEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: session.user.id,
                endTime: null,
            },
            orderBy: {
                startTime: "desc",
            },
        });

        // Bereken de uren van vandaag
        const todayEntries = await prisma.timeEntry.findMany({
            where: {
                userId: session.user.id,
                startTime: {
                    gte: today,
                },
                endTime: {
                    not: null,
                },
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
                endTime: {
                    not: null,
                },
            },
        });

        const weekHours = weekEntries.reduce((acc, entry) => {
            const duration = new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime();
            return acc + duration / (1000 * 60 * 60);
        }, 0);

        return NextResponse.json({
            isClocked: !!currentEntry,
            currentEntry,
            todayHours: Math.round(todayHours * 100) / 100,
            weekHours: Math.round(weekHours * 100) / 100,
        });
    } catch (error) {
        console.error("Error fetching clock state:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan" },
            { status: 500 }
        );
    }
} 