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

        const { type, message, targetRole } = await request.json();

        // Bepaal welke gebruikers de notificatie moeten ontvangen
        let targetUsers;

        if (targetRole) {
            // Specifieke rol
            targetUsers = await prisma.user.findMany({
                where: { role: targetRole }
            });
        } else {
            // Standaard: alleen admins en managers
            targetUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { role: "ADMIN" },
                        { role: "MANAGER" }
                    ]
                }
            });
        }

        // Maak notificaties aan voor de doelgebruikers
        await Promise.all(targetUsers.map((user: any) =>
            prisma.notification.create({
                data: {
                    userId: user.id,
                    type: type || "TIME_TRACKING",
                    enabled: true
                }
            })
        ));

        return NextResponse.json({
            success: true,
            message: `Notificatie verstuurd naar ${targetUsers.length} gebruiker(s)`
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan bij het aanmaken van de notificatie" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Niet geautoriseerd" },
                { status: 401 }
            );
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                enabled: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan bij het ophalen van de notificaties" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Niet geautoriseerd" },
                { status: 401 }
            );
        }

        const { notificationId } = await request.json();

        await prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                enabled: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
            { error: "Er is iets misgegaan bij het bijwerken van de notificatie" },
            { status: 500 }
        );
    }
} 