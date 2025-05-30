import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/projects/:id
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startDate, endDate, company } = body;

        // Check if project exists
        const existingProject = await prisma.project.findUnique({
            where: { id: params.id },
        });

        if (!existingProject) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const updatedProject = await prisma.project.update({
            where: { id: params.id },
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                company,
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        // Transform the response to match the expected format
        const transformedProject = {
            ...updatedProject,
            assignedEmployees: (updatedProject as any).assignments?.map((assignment: any) => ({
                id: assignment.user.id,
                name: assignment.user.name,
                email: assignment.user.email,
                role: assignment.user.role,
            })) || [],
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/:id
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if project exists
        const existingProject = await prisma.project.findUnique({
            where: { id: params.id },
        });

        if (!existingProject) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Delete project
        await prisma.project.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 