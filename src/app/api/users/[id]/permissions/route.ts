import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, UserRole } from '@/lib/permissions';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to change user roles
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canChangeUserRoles')) {
            return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
        }

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(targetUser);
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to change user roles
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canChangeUserRoles')) {
            return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
        }

        const { role } = await request.json();

        if (!['ADMIN', 'MANAGER', 'HR_MANAGER', 'PLANNER', 'EMPLOYEE', 'FREELANCER'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 