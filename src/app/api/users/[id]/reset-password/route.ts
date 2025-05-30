import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { hasPermission, UserRole } from '@/lib/permissions';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to reset passwords
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canResetPasswords')) {
            return NextResponse.json({ error: "Access denied - Admin or Manager only" }, { status: 403 });
        }

        const { newPassword } = await request.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: "Wachtwoord moet minimaal 6 karakters lang zijn" },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json({
            message: "Wachtwoord succesvol gereset",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: "Er is een fout opgetreden bij het resetten van het wachtwoord" },
            { status: 500 }
        );
    }
} 