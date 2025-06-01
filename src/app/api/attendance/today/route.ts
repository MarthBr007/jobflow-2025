import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Use provided date or today
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        const dateStart = startOfDay(targetDate);
        const dateEnd = endOfDay(targetDate);

        // Get all active employees
        const employees = await prisma.user.findMany({
            where: {
                archived: false,
                role: {
                    in: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'FREELANCER']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                employeeType: true,
                company: true,
                profileImage: true,
                status: true
            }
        });

        // Get time entries for today
        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                startTime: {
                    gte: dateStart,
                    lte: dateEnd
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        employeeType: true,
                        company: true,
                        profileImage: true,
                        status: true
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        // Create attendance records from time entries
        const attendanceMap = new Map();

        // Initialize all employees as absent
        employees.forEach(employee => {
            attendanceMap.set(employee.id, {
                id: `attendance_${employee.id}_${format(targetDate, 'yyyy-MM-dd')}`,
                userId: employee.id,
                date: format(targetDate, 'yyyy-MM-dd'),
                checkIn: null,
                checkOut: null,
                status: 'ABSENT',
                notes: null,
                user: employee
            });
        });

        // Update with actual time entries
        timeEntries.forEach(entry => {
            const existing = attendanceMap.get(entry.userId);
            if (existing) {
                // Determine status based on notes/workType
                let status = 'PRESENT';
                if (entry.notes?.includes('SICK')) {
                    status = 'SICK';
                } else if (entry.notes?.includes('VACATION')) {
                    status = 'VACATION';
                }

                attendanceMap.set(entry.userId, {
                    ...existing,
                    checkIn: entry.startTime.toISOString(),
                    checkOut: entry.endTime?.toISOString() || null,
                    status: status,
                    notes: entry.notes
                });
            }
        });

        const attendance = Array.from(attendanceMap.values());

        // Calculate statistics
        const stats = {
            totalEmployees: employees.length,
            present: attendance.filter(a => a.status === 'PRESENT').length,
            absent: attendance.filter(a => a.status === 'ABSENT').length,
            sick: attendance.filter(a => a.status === 'SICK').length,
            vacation: attendance.filter(a => a.status === 'VACATION').length,
        };

        return NextResponse.json({
            attendance,
            stats,
            date: format(targetDate, 'yyyy-MM-dd')
        });

    } catch (error) {
        console.error('Error fetching today attendance:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 