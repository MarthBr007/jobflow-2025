import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/personnel/:id
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
        console.log('Received update data:', JSON.stringify(body, null, 2));

        const {
            name,
            email,
            role,
            employeeType,
            company,
            phone,
            address,
            hourlyRate,
            monthlySalary,
            hourlyWage,
            workTypes,
            kvkNumber,
            btwNumber,
            hasContract,
            firstName,
            lastName,
            iban,
            availableDays,
            archived
        } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!existingUser) {
            console.log(`User not found with ID: ${params.id}`);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('Found existing user:', existingUser.email);

        // Check if email is already taken by another user
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email },
            });

            if (emailExists) {
                console.log(`Email already in use: ${email}`);
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 400 }
                );
            }
        }

        // Map role to valid Prisma enum values
        let mappedRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER';
        switch (role?.toUpperCase()) {
            case 'ADMIN':
                mappedRole = 'ADMIN';
                break;
            case 'MANAGER':
                mappedRole = 'MANAGER';
                break;
            case 'EMPLOYEE':
                mappedRole = 'EMPLOYEE';
                break;
            case 'FREELANCER':
            default:
                mappedRole = 'FREELANCER';
                break;
        }

        console.log(`Updating user ${params.id} with role: ${mappedRole}, employeeType: ${employeeType}`);

        // Prepare update data with proper validation
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = mappedRole;
        if (employeeType !== undefined) updateData.employeeType = employeeType;
        if (company !== undefined) updateData.company = company;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
        if (monthlySalary !== undefined) updateData.monthlySalary = monthlySalary;
        if (hourlyWage !== undefined) updateData.hourlyWage = hourlyWage;
        if (kvkNumber !== undefined) updateData.kvkNumber = kvkNumber;
        if (btwNumber !== undefined) updateData.btwNumber = btwNumber;
        if (hasContract !== undefined) updateData.hasContract = hasContract;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (iban !== undefined) updateData.iban = iban;
        if (availableDays !== undefined) updateData.availableDays = availableDays;

        // Handle archiving
        if (archived !== undefined) {
            updateData.archived = archived;
            if (archived) {
                updateData.archivedAt = new Date();
            } else {
                updateData.archivedAt = null;
            }
        }

        console.log('Update data prepared:', JSON.stringify(updateData, null, 2));

        // First, update the user without work types
        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: updateData
        });

        console.log('User updated successfully');

        // Then handle work types separately
        if (workTypes && Array.isArray(workTypes)) {
            console.log('Updating work types:', workTypes);

            // Delete existing work types
            await prisma.userWorkType.deleteMany({
                where: { userId: params.id }
            });

            // Handle work types - they can be either strings (names) or objects with names
            let workTypeNames: string[] = [];

            if (workTypes.length > 0) {
                // Convert work types to names if they are objects
                workTypeNames = workTypes.map((workType: any) => {
                    if (typeof workType === 'string') {
                        return workType;
                    } else if (workType && typeof workType === 'object' && workType.name) {
                        return workType.name;
                    } else {
                        console.warn('Invalid work type format:', workType);
                        return null;
                    }
                }).filter(Boolean);

                console.log('Processed work type names:', workTypeNames);

                if (workTypeNames.length > 0) {
                    // Get work type IDs from names
                    const workTypeRecords = await prisma.workType.findMany({
                        where: {
                            name: {
                                in: workTypeNames
                            }
                        },
                        select: {
                            id: true,
                            name: true
                        }
                    });

                    console.log('Found work type records:', workTypeRecords);

                    // Create new work type associations
                    if (workTypeRecords.length > 0) {
                        await prisma.userWorkType.createMany({
                            data: workTypeRecords.map((workType: any) => ({
                                userId: params.id,
                                workTypeId: workType.id
                            }))
                        });
                        console.log('Work types updated successfully');
                    }
                }
            }
        }

        // Fetch the updated user with work types
        const finalUser = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                UserWorkType: {
                    select: {
                        workType: {
                            select: {
                                id: true,
                                name: true,
                                emoji: true,
                                description: true
                            }
                        }
                    }
                }
            }
        });

        if (!finalUser) {
            console.log('User not found after update');
            return NextResponse.json(
                { error: 'User not found after update' },
                { status: 404 }
            );
        }

        // Transform the data to match the frontend interface
        const transformedUser = {
            ...finalUser,
            workTypes: finalUser.UserWorkType.map((uwt: any) => uwt.workType.name)
        };

        console.log('Returning updated user:', transformedUser.email);
        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error updating employee:', error);
        console.error('Error stack:', (error as Error).stack);
        return NextResponse.json(
            { error: `Internal Server Error: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

// DELETE /api/personnel/:id (Archive instead of delete)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Don't allow users to delete themselves
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Archive the user instead of deleting
        const archivedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                archived: true,
                archivedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Employee successfully archived',
            user: {
                id: archivedUser.id,
                name: archivedUser.name,
                email: archivedUser.email,
                archived: archivedUser.archived,
                archivedAt: archivedUser.archivedAt
            }
        });
    } catch (error) {
        console.error('Error archiving employee:', error);
        return NextResponse.json(
            { error: 'Failed to archive employee. Please try again.' },
            { status: 500 }
        );
    }
}

// GET /api/personnel/:id
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // In the GET function, add work pattern assignments to the response
        const employee = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                workPatternAssignments: {
                    where: { isActive: true },
                    include: {
                        pattern: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                totalHoursPerWeek: true,
                                workDays: true,
                                color: true,
                                icon: true,
                                description: true,
                            },
                        },
                        assignedBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        startDate: 'desc',
                    },
                },
                UserWorkType: {
                    include: {
                        workType: true,
                    },
                },
            },
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Transform the data to match the frontend interface
        const transformedUser = {
            ...employee,
            workTypes: employee.UserWorkType.map((uwt: any) => uwt.workType.name),
            workPatternAssignments: employee.workPatternAssignments.map((assignment: any) => ({
                ...assignment.pattern,
                assignedBy: assignment.assignedBy,
                startDate: assignment.startDate,
                endDate: assignment.endDate,
            }))
        };

        console.log('Returning updated user:', transformedUser.email);
        return NextResponse.json(transformedUser);
    } catch (error) {
        console.error('Error fetching employee:', error);
        console.error('Error stack:', (error as Error).stack);
        return NextResponse.json(
            { error: `Internal Server Error: ${(error as Error).message}` },
            { status: 500 }
        );
    }
} 