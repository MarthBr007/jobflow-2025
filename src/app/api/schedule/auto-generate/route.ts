import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';
import { addDays, getDay, startOfDay, format } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!hasPermission(session.user.role as UserRole, 'canManageShifts')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const data = await request.json();
        const { startDate, endDate, overwriteExisting = false } = data;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'startDate and endDate are required' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return NextResponse.json(
                { error: 'startDate cannot be after endDate' },
                { status: 400 }
            );
        }

        // Get all active schedule assignments
        const assignments = await prisma.userScheduleAssignment.findMany({
            where: {
                isActive: true,
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: start } }
                ],
                validFrom: { lte: end }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                template: {
                    include: {
                        shifts: {
                            include: {
                                workLocation: true,
                                project: true,
                            },
                        },
                    },
                },
            },
        });

        let generatedShifts = 0;
        let skippedShifts = 0;
        const errors: string[] = [];

        // Iterate through each day in the range
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = getDay(currentDate); // 0 = Sunday, 1 = Monday, etc.
            const dateStart = startOfDay(currentDate);

            // Find or create schedule for this date
            let schedule = await prisma.schedule.findUnique({
                where: { date: dateStart },
            });

            if (!schedule) {
                schedule = await prisma.schedule.create({
                    data: {
                        date: dateStart,
                        title: `Automatisch Rooster - ${format(currentDate, 'EEEE d MMMM yyyy')}`,
                        description: 'Automatisch gegenereerd rooster op basis van vaste patronen',
                        createdById: session.user.id,
                    },
                });
            }

            // Find assignments for this day of week
            const dayAssignments = assignments.filter(a => a.dayOfWeek === dayOfWeek);

            for (const assignment of dayAssignments) {
                try {
                    // For each shift in the template
                    for (const templateShift of assignment.template.shifts) {
                        // Use custom times if provided, otherwise use template times
                        const startTime = assignment.customStartTime || templateShift.startTime;
                        const endTime = assignment.customEndTime || templateShift.endTime;
                        const breaks = assignment.customBreaks || templateShift.breaks;

                        // Create full datetime
                        const shiftStartTime = new Date(currentDate);
                        const [startHour, startMinute] = startTime.split(':');
                        shiftStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

                        const shiftEndTime = new Date(currentDate);
                        const [endHour, endMinute] = endTime.split(':');
                        shiftEndTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

                        // If end time is before start time, it's next day
                        if (shiftEndTime <= shiftStartTime) {
                            shiftEndTime.setDate(shiftEndTime.getDate() + 1);
                        }

                        // Check if shift already exists for this user on this date
                        const existingShift = await prisma.scheduleShift.findFirst({
                            where: {
                                scheduleId: schedule.id,
                                userId: assignment.userId,
                                startTime: { lte: shiftEndTime },
                                endTime: { gte: shiftStartTime },
                            },
                        });

                        if (existingShift && !overwriteExisting) {
                            skippedShifts++;
                            continue;
                        }

                        if (existingShift && overwriteExisting) {
                            await prisma.scheduleShift.delete({
                                where: { id: existingShift.id },
                            });
                        }

                        // Create the shift
                        await prisma.scheduleShift.create({
                            data: {
                                scheduleId: schedule.id,
                                userId: assignment.userId,
                                projectId: templateShift.projectId,
                                startTime: shiftStartTime,
                                endTime: shiftEndTime,
                                role: templateShift.role,
                                notes: assignment.notes || templateShift.notes,
                                breaks: breaks as any,
                                status: 'SCHEDULED',
                            },
                        });

                        generatedShifts++;
                    }
                } catch (error) {
                    console.error(`Error creating shift for assignment ${assignment.id}:`, error);
                    errors.push(`Fout bij aanmaken dienst voor ${assignment.user.name} op ${format(currentDate, 'dd-MM-yyyy')}`);
                }
            }

            currentDate = addDays(currentDate, 1);
        }

        return NextResponse.json({
            success: true,
            generatedShifts,
            skippedShifts,
            errors,
            message: `${generatedShifts} diensten aangemaakt, ${skippedShifts} overgeslagen${errors.length > 0 ? `, ${errors.length} fouten` : ''}`
        });

    } catch (error) {
        console.error('Error auto-generating schedule:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 