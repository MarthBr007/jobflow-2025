import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Only admins can approve users
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, role } = await request.json();

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const userId = params.id;

        // Find the user to approve/reject
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                accountStatus: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.accountStatus !== 'PENDING') {
            return NextResponse.json({
                error: 'User is not pending approval'
            }, { status: 400 });
        }

        const adminUserId = (session.user as any).id;

        if (action === 'approve') {
            // Approve the user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    accountStatus: 'APPROVED',
                    approvedBy: adminUserId,
                    approvedAt: new Date(),
                    role: role || user.role // Allow admin to set role during approval
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    accountStatus: true,
                    approvedAt: true
                }
            });

            // TODO: Send approval notification email to user

            return NextResponse.json({
                message: `User ${user.firstName} ${user.lastName} has been approved`,
                user: updatedUser
            });

        } else if (action === 'reject') {
            // Reject the user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    accountStatus: 'REJECTED',
                    approvedBy: adminUserId,
                    approvedAt: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    accountStatus: true,
                    approvedAt: true
                }
            });

            // TODO: Send rejection notification email to user

            return NextResponse.json({
                message: `User ${user.firstName} ${user.lastName} has been rejected`,
                user: updatedUser
            });
        }

    } catch (error) {
        console.error('Error approving/rejecting user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 