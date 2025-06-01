import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { dbOptimizer } from '@/lib/database-optimizer';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'week';

        // Use cached query for better performance
        const cacheKey = `analytics_${period}_${new Date().toDateString()}`;

        const analyticsData = await dbOptimizer.cachedQuery(
            cacheKey,
            async () => {
                // Get basic counts
                const [totalUsers, activeProjects, completedShifts] = await Promise.all([
                    prisma.user.count({ where: { archived: false } }),
                    prisma.project.count({ where: { status: 'ACTIVE' } }),
                    prisma.scheduleShift.count({ where: { status: 'COMPLETED' } })
                ]);

                // Employee types
                const employeeTypes = await prisma.user.groupBy({
                    by: ['employeeType'],
                    where: { archived: false },
                    _count: true
                });

                return {
                    overview: {
                        totalUsers,
                        activeUsers: Math.floor(totalUsers * 0.8), // Mock 80% active
                        totalProjects: activeProjects,
                        completedShifts,
                        averageUtilization: 87,
                        revenue: 125000,
                        trends: { users: 5.2, projects: 8.1, shifts: 12.3, revenue: 7.8 }
                    },
                    workforce: {
                        byType: employeeTypes.map((type, i) => ({
                            name: type.employeeType || 'Unknown',
                            value: type._count,
                            color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4]
                        })),
                        byRole: [
                            { name: 'ADMIN', value: 2, percentage: 5 },
                            { name: 'MANAGER', value: 8, percentage: 20 },
                            { name: 'EMPLOYEE', value: 25, percentage: 62 },
                            { name: 'FREELANCER', value: 5, percentage: 13 }
                        ],
                        performance: [
                            { name: 'Warehouse', efficiency: 87, satisfaction: 92, hours: 2400 },
                            { name: 'Logistics', efficiency: 91, satisfaction: 88, hours: 1800 },
                            { name: 'Customer Service', efficiency: 83, satisfaction: 94, hours: 1600 }
                        ],
                        attendance: [
                            { date: 'Ma 1', scheduled: 25, actual: 23, percentage: 92 },
                            { date: 'Di 2', scheduled: 25, actual: 25, percentage: 100 },
                            { date: 'Wo 3', scheduled: 25, actual: 24, percentage: 96 },
                            { date: 'Do 4', scheduled: 25, actual: 25, percentage: 100 },
                            { date: 'Vr 5', scheduled: 25, actual: 22, percentage: 88 }
                        ]
                    },
                    projects: {
                        status: [
                            { name: 'ACTIVE', value: activeProjects, color: '#10b981' },
                            { name: 'COMPLETED', value: 12, color: '#3b82f6' },
                            { name: 'PENDING', value: 3, color: '#f59e0b' },
                            { name: 'CANCELLED', value: 1, color: '#ef4444' }
                        ],
                        timeline: [
                            { month: 'Jan', started: 5, completed: 3, revenue: 25000 },
                            { month: 'Feb', started: 7, completed: 4, revenue: 32000 },
                            { month: 'Mar', started: 6, completed: 6, revenue: 28000 },
                            { month: 'Apr', started: 8, completed: 5, revenue: 35000 },
                            { month: 'May', started: 4, completed: 7, revenue: 30000 },
                            { month: 'Jun', started: 6, completed: 4, revenue: 27000 }
                        ],
                        performance: [
                            { project: 'Warehouse A', progress: 87, budget: 50000, spent: 42000, efficiency: 95 },
                            { project: 'Distribution Center', progress: 92, budget: 75000, spent: 68000, efficiency: 91 }
                        ]
                    },
                    timeTracking: {
                        weekly: [
                            { day: 'Ma', productive: 7.5, break: 1, overtime: 0.5 },
                            { day: 'Di', productive: 8, break: 1, overtime: 1 },
                            { day: 'Wo', productive: 7.8, break: 1, overtime: 0.2 },
                            { day: 'Do', productive: 8.2, break: 1, overtime: 1.2 },
                            { day: 'Vr', productive: 7.3, break: 1, overtime: 0.3 }
                        ],
                        productivity: [
                            { hour: '08:00', efficiency: 75, tasks: 8 },
                            { hour: '09:00', efficiency: 85, tasks: 12 },
                            { hour: '10:00', efficiency: 92, tasks: 15 },
                            { hour: '11:00', efficiency: 88, tasks: 14 },
                            { hour: '12:00', efficiency: 60, tasks: 6 },
                            { hour: '13:00', efficiency: 70, tasks: 9 },
                            { hour: '14:00', efficiency: 85, tasks: 13 },
                            { hour: '15:00', efficiency: 82, tasks: 11 },
                            { hour: '16:00', efficiency: 78, tasks: 10 },
                            { hour: '17:00', efficiency: 72, tasks: 8 }
                        ]
                    },
                    system: {
                        performance: {
                            avgResponseTime: 150,
                            uptime: 99.8,
                            errors: 2,
                            cacheHitRate: 85
                        },
                        usage: [
                            { feature: 'Time Tracking', usage: 95, growth: 12 },
                            { feature: 'Scheduling', usage: 87, growth: 8 },
                            { feature: 'Project Management', usage: 78, growth: 15 },
                            { feature: 'Reporting', usage: 65, growth: 22 },
                            { feature: 'Chat', usage: 72, growth: 18 }
                        ]
                    }
                };
            },
            5 // Cache for 5 minutes
        );

        return NextResponse.json(analyticsData);

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
} 