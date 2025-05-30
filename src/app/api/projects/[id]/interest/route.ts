import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail, createInterestConfirmationEmail, createAdminNotificationEmail } from '@/lib/email';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        // Get the current user from database to ensure we have the correct ID
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, company: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
        }

        const { interested, notes } = await request.json();
        const projectId = params.id;

        // Check if project exists and is still active
        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
                status: "ACTIVE"
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project niet gevonden of niet meer actief' },
                { status: 404 }
            );
        }

        // Check if project belongs to same company as user
        if (project.company !== currentUser.company) {
            return NextResponse.json(
                { error: 'Je kunt alleen interesse tonen in projecten van je eigen bedrijf' },
                { status: 403 }
            );
        }

        // Check if user is not already assigned to this project
        const existingMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: currentUser.id,
                }
            }
        });

        if (existingMember) {
            return NextResponse.json(
                { error: 'Je bent al toegewezen aan dit project' },
                { status: 400 }
            );
        }

        // Update or create project interest
        const projectInterest = await prisma.projectInterest.upsert({
            where: {
                projectId_userId: {
                    projectId,
                    userId: currentUser.id,
                },
            },
            update: {
                status: interested ? 'INTERESTED' : 'NOT_INTERESTED',
                notes: notes || null,
                updatedAt: new Date(),
            },
            create: {
                projectId,
                userId: currentUser.id,
                status: interested ? 'INTERESTED' : 'NOT_INTERESTED',
                notes: notes || null,
            },
        });

        // Send emails if user is interested
        if (interested) {
            try {
                // Get full user details for email
                const fullUser = await prisma.user.findUnique({
                    where: { id: currentUser.id },
                    select: { name: true, email: true },
                });

                if (fullUser?.email && fullUser?.name) {
                    // Send confirmation email to user
                    const confirmationEmail = createInterestConfirmationEmail(
                        fullUser.name,
                        project.name,
                        project.company,
                        notes
                    );

                    await sendEmail({
                        to: fullUser.email,
                        subject: confirmationEmail.subject,
                        html: confirmationEmail.html,
                        text: confirmationEmail.text,
                    });

                    // Send notification email to admins/managers of the same company
                    const admins = await prisma.user.findMany({
                        where: {
                            company: currentUser.company,
                            role: { in: ['ADMIN', 'MANAGER'] },
                        },
                        select: { email: true },
                    });

                    const adminNotificationEmail = createAdminNotificationEmail(
                        fullUser.name,
                        fullUser.email,
                        project.name,
                        project.company,
                        notes
                    );

                    // Send to all admins/managers
                    for (const admin of admins) {
                        if (admin.email) {
                            await sendEmail({
                                to: admin.email,
                                subject: adminNotificationEmail.subject,
                                html: adminNotificationEmail.html,
                                text: adminNotificationEmail.text,
                            });
                        }
                    }
                }
            } catch (emailError) {
                console.error('Error sending emails:', emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            message: interested ? 'Interesse geregistreerd en bevestigingsmail verzonden' : 'Gemarkeerd als niet beschikbaar',
            data: projectInterest
        });
    } catch (error) {
        console.error('Error handling project interest:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan' },
            { status: 500 }
        );
    }
} 