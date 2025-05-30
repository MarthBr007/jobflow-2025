import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user to check role
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true, company: true },
        });

        if (!currentUser || !currentUser.company) {
            return NextResponse.json({ error: 'User or company not found' }, { status: 404 });
        }

        const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

        const projects = await prisma.project.findMany({
            where: {
                company: currentUser.company,
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                ...(isAdminOrManager && {
                    projectInterests: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                }),
            },
        });

        const transformedProjects = projects.map((project: any) => ({
            ...project,
            assignedEmployees: project.assignments.map((assignment: any) => ({
                id: assignment.user.id,
                name: assignment.user.name,
            })),
            ...(isAdminOrManager && {
                interestedEmployees: project.projectInterests?.map((interest: any) => ({
                    id: interest.user.id,
                    name: interest.user.name,
                    status: interest.status,
                    notes: interest.notes,
                })) || [],
            }),
        }));

        return NextResponse.json(transformedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, startDate, endDate, company } = body;

        const project = await prisma.project.create({
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
                            },
                        },
                    },
                },
            },
        });

        const transformedProject = {
            ...project,
            assignedEmployees: project.assignments.map((assignment: any) => ({
                id: assignment.user.id,
                name: assignment.user.name,
            })),
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 