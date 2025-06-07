import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission, UserRole } from "@/lib/permissions";
import { format, startOfWeek, endOfWeek, parseISO, getDay, addDays } from "date-fns";
import { nl } from "date-fns/locale";

// Helper function to calculate hours between two times
function calculateHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const totalMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

// Get planned hours for a specific day based on work pattern
function getPlannedHoursForDay(dayOfWeek: number, workPattern: any): number {
  if (!workPattern?.workDays) return 0;

  // workDays is JSON data, parse it if it's a string
  const workDays = typeof workPattern.workDays === 'string'
    ? JSON.parse(workPattern.workDays)
    : workPattern.workDays;

  if (!Array.isArray(workDays)) return 0;

  const workDay = workDays.find((day: any) => day.dayOfWeek === dayOfWeek);
  if (!workDay || !workDay.isWorkingDay) return 0;

  return calculateHours(
    workDay.startTime || "09:00",
    workDay.endTime || "17:00",
    workDay.breakDuration || 60
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canApproveTimeEntries')) {
      return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get('week') || format(new Date(), 'yyyy-\'W\'ww');

    // Parse week parameter (format: 2024-W01)
    const [year, weekNumber] = weekParam.split('-W');
    const weekStart = startOfWeek(new Date(parseInt(year), 0, 1 + (parseInt(weekNumber) - 1) * 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    // Get all employees (excluding freelancers from hours approval as they don't have fixed patterns)
    const employees = await prisma.user.findMany({
      where: {
        company: currentUser.company,
        employeeType: {
          in: ['PERMANENT', 'FLEX_WORKER'] // Include both but focus on PERMANENT for pattern checking
        }
      },
      include: {
        workPatternAssignments: {
          where: {
            startDate: { lte: weekEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: weekStart } }
            ]
          },
          include: {
            pattern: true
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1
        },
        timeEntries: {
          where: {
            startTime: {
              gte: weekStart,
              lte: weekEnd
            },
            endTime: { not: null }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    });

    const hoursEntries = [];

    for (const employee of employees) {
      // Skip if no work pattern assigned (for permanent employees this indicates setup issue)
      const currentPattern = employee.workPatternAssignments[0]?.pattern;

      if (employee.employeeType === 'PERMANENT' && !currentPattern) {
        // Create entry indicating missing work pattern
        hoursEntries.push({
          id: `missing-pattern-${employee.id}`,
          userId: employee.id,
          userName: employee.name || 'Onbekend',
          userEmail: employee.email || '',
          employeeType: employee.employeeType,
          contractType: employee.contractType || 'UNKNOWN',
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          plannedHours: 0,
          actualHours: 0,
          overtime: 0,
          undertime: 0,
          compensationHours: 0,
          hasDiscrepancy: true,
          timeEntries: [],
          currentPattern: null,
          status: 'PENDING' as const
        });
        continue;
      }

      // Calculate planned hours for the week
      let plannedHours = 0;
      if (currentPattern && employee.employeeType === 'PERMANENT') {
        plannedHours = currentPattern.totalHoursPerWeek || 0;
      }

      // Calculate actual hours worked
      let actualHours = 0;
      const dailyEntries = [];

      // Group time entries by day
      const entriesByDay = new Map();
      for (const entry of employee.timeEntries) {
        const entryDate = format(entry.startTime, 'yyyy-MM-dd');
        if (!entriesByDay.has(entryDate)) {
          entriesByDay.set(entryDate, []);
        }
        entriesByDay.get(entryDate).push(entry);
      }

      // Process each day of the week
      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const dayOfWeek = getDay(currentDay);
        const dateStr = format(currentDay, 'yyyy-MM-dd');

        const dayEntries = entriesByDay.get(dateStr) || [];
        let dayActualHours = 0;
        let dayStartTime = '';
        let dayEndTime = '';

        // Calculate total hours for this day
        for (const entry of dayEntries) {
          if (entry.endTime) {
            const startTime = new Date(entry.startTime);
            const endTime = new Date(entry.endTime);
            const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const adjustedHours = Math.max(0, hoursWorked - ((entry.totalBreakMinutes || 0) / 60));
            dayActualHours += adjustedHours;

            if (!dayStartTime || format(startTime, 'HH:mm') < dayStartTime) {
              dayStartTime = format(startTime, 'HH:mm');
            }
            if (!dayEndTime || format(endTime, 'HH:mm') > dayEndTime) {
              dayEndTime = format(endTime, 'HH:mm');
            }
          }
        }

        actualHours += dayActualHours;

        // Get planned hours for this day
        const dayPlannedHours = employee.employeeType === 'PERMANENT'
          ? getPlannedHoursForDay(dayOfWeek, currentPattern)
          : 0; // Flex workers don't have fixed daily patterns

        const dayDiscrepancy = dayActualHours - dayPlannedHours;

        // Only add entries where there was actual work or it was a planned work day
        if (dayActualHours > 0 || dayPlannedHours > 0) {
          dailyEntries.push({
            id: `${employee.id}-${dateStr}`,
            date: dateStr,
            startTime: dayStartTime || '—',
            endTime: dayEndTime || '—',
            hoursWorked: dayActualHours,
            plannedDayHours: dayPlannedHours,
            dayDiscrepancy: dayDiscrepancy,
            approved: dayEntries.length > 0 ? dayEntries.every(e => e.approved) : false
          });
        }
      }

      // Calculate overtime/undertime
      const difference = actualHours - plannedHours;
      const overtime = Math.max(0, difference);
      const undertime = Math.max(0, -difference);

      // For permanent employees, overures can become compensation hours (1:1 ratio)
      const compensationHours = employee.employeeType === 'PERMANENT' ? overtime : 0;

      // Determine if there's a significant discrepancy (more than 30 minutes difference)
      const hasDiscrepancy = Math.abs(difference) > 0.5;

      // Determine status - check if any time entries are not approved yet
      const hasUnapprovedEntries = employee.timeEntries.some(entry => !entry.approved);
      const status = hasUnapprovedEntries ? 'PENDING' : 'APPROVED';

      hoursEntries.push({
        id: `${employee.id}-${format(weekStart, 'yyyy-ww')}`,
        userId: employee.id,
        userName: employee.name || 'Onbekend',
        userEmail: employee.email || '',
        employeeType: employee.employeeType,
        contractType: employee.contractType || 'UNKNOWN',
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        plannedHours,
        actualHours,
        overtime,
        undertime,
        compensationHours,
        hasDiscrepancy,
        timeEntries: dailyEntries,
        currentPattern: currentPattern ? {
          id: currentPattern.id,
          name: currentPattern.name,
          description: currentPattern.description,
          totalHoursPerWeek: currentPattern.totalHoursPerWeek,
          workDays: typeof currentPattern.workDays === 'string'
            ? JSON.parse(currentPattern.workDays)
            : currentPattern.workDays
        } : null,
        status
      });
    }

    return NextResponse.json({
      success: true,
      entries: hoursEntries,
      week: {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd'),
        label: format(weekStart, 'dd MMM', { locale: nl }) + ' - ' + format(weekEnd, 'dd MMM yyyy', { locale: nl })
      }
    });

  } catch (error) {
    console.error('Error fetching hours approval data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, company: true },
    });

    if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canApproveTimeEntries')) {
      return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, approved, compensationHours = 0 } = body;

    // Extract user ID and week from the approval ID
    const [userId] = id.split('-');

    if (!userId) {
      return NextResponse.json({ error: 'Invalid approval ID' }, { status: 400 });
    }

    // Get the user's time entries for this approval
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        company: true,
        employeeType: true
      }
    });

    if (!user || user.company !== currentUser.company) {
      return NextResponse.json({ error: 'User not found or access denied' }, { status: 404 });
    }

    if (approved) {
      // If approved, mark all time entries as approved and create compensation if applicable
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          userId: userId,
          approved: false,
          endTime: { not: null }
        }
      });

      // Update all time entries to approved
      await prisma.timeEntry.updateMany({
        where: {
          userId: userId,
          approved: false,
          endTime: { not: null }
        },
        data: {
          approved: true,
          approvedBy: currentUser.id,
          approvedAt: new Date()
        }
      });

      // Create compensation time entry if there are compensation hours and it's a permanent employee
      if (compensationHours > 0 && user.employeeType === 'PERMANENT') {
        await prisma.timeEntry.create({
          data: {
            userId: userId,
            startTime: new Date(),
            endTime: new Date(Date.now() + (compensationHours * 60 * 60 * 1000)),
            description: `Tijd-voor-tijd compensatie - ${compensationHours}u opgebouwd`,
            workType: 'COMPENSATION_EARNED',
            approved: true,
            approvedBy: currentUser.id,
            approvedAt: new Date(),
            hoursWorked: compensationHours,
            compensationEarned: compensationHours
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Uren goedgekeurd voor ${user.name}${compensationHours > 0 ? ` met ${compensationHours}u compensatie` : ''}`,
        compensationAwarded: compensationHours
      });

    } else {
      // If rejected, we might want to add notes or handle differently
      // For now, just mark as rejected (you could add a rejected status to time entries)

      return NextResponse.json({
        success: true,
        message: `Uren afgewezen voor ${user.name}`,
        compensationAwarded: 0
      });
    }

  } catch (error) {
    console.error('Error processing hours approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 