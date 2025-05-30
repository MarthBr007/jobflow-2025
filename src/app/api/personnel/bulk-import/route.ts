import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { hasPermission, UserRole } from '@/lib/permissions';

interface ImportEmployee {
    name: string;
    email: string;
    role: string;
    employeeType?: string;
    company: string;
    phone?: string;
    address?: string;
    hourlyRate?: string;
    monthlySalary?: string;
    hourlyWage?: string;
    workTypes?: string[];
    kvkNumber?: string;
    btwNumber?: string;
    hasContract?: boolean;
}

export async function POST(request: Request): Promise<NextResponse> {
    console.log('🚀 Starting bulk import process...');

    // Set up timeout
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
        setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 30000); // 30 second timeout
    });

    try {
        const processRequest = async (): Promise<NextResponse> => {
            console.log('🔐 Checking session...');
            const session = await getServerSession(authOptions);

            if (!session?.user?.email) {
                console.log('❌ No session found');
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // Check if user has permission to create users
            const currentUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { role: true, company: true },
            });

            if (!currentUser || !hasPermission(currentUser.role as UserRole, 'canCreateUsers')) {
                console.log('❌ Unauthorized access attempt');
                return NextResponse.json({ error: 'Access denied - Admin or Manager only' }, { status: 403 });
            }

            console.log('✅ User authorized:', session.user.email);

            console.log('📥 Parsing request body...');
            const { employees }: { employees: ImportEmployee[] } = await request.json();

            if (!employees || !Array.isArray(employees) || employees.length === 0) {
                console.log('❌ No employees provided');
                return NextResponse.json({ error: 'Geen medewerkers om te importeren' }, { status: 400 });
            }

            console.log(`📊 Processing ${employees.length} employees`);

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
                created: [] as any[],
            };

            // Process each employee
            for (let i = 0; i < employees.length; i++) {
                const employee = employees[i];
                console.log(`🔄 Processing employee ${i + 1}/${employees.length}: ${employee.name}`);

                try {
                    // Check if user already exists
                    console.log(`🔍 Checking if user exists: ${employee.email}`);
                    const existingUser = await prisma.user.findUnique({
                        where: { email: employee.email },
                    });

                    if (existingUser) {
                        console.log(`⚠️ User already exists: ${employee.email}`);
                        results.failed++;
                        results.errors.push(`Rij ${i + 1}: Email ${employee.email} bestaat al`);
                        continue;
                    }

                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(employee.email)) {
                        console.log(`❌ Invalid email format: ${employee.email}`);
                        results.failed++;
                        results.errors.push(`Rij ${i + 1}: Ongeldig email formaat: ${employee.email}`);
                        continue;
                    }

                    // Map role to valid Prisma enum values
                    let mappedRole: string;
                    switch (employee.role.toUpperCase()) {
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

                    // Map employeeType to valid Prisma enum values
                    let mappedEmployeeType: string;
                    switch ((employee.employeeType || employee.role).toUpperCase()) {
                        case 'PERMANENT':
                        case 'VAST':
                        case 'VASTE_MEDEWERKER':
                        case 'EMPLOYEE':
                            mappedEmployeeType = 'PERMANENT';
                            break;
                        case 'FLEX':
                        case 'FLEX_WORKER':
                        case 'OPROEPKRACHT':
                        case 'OPROEP':
                            mappedEmployeeType = 'FLEX_WORKER';
                            break;
                        case 'FREELANCER':
                        default:
                            mappedEmployeeType = 'FREELANCER';
                            break;
                    }

                    console.log(`🔄 Mapping role "${employee.role}" to "${mappedRole}"`);
                    console.log(`🔄 Mapping employeeType "${employee.employeeType || employee.role}" to "${mappedEmployeeType}"`);

                    // Generate a temporary password
                    console.log(`🔑 Generating password for: ${employee.email}`);
                    const tempPassword = Math.random().toString(36).slice(-8);
                    const hashedPassword = await bcrypt.hash(tempPassword, 12);

                    // Create user
                    console.log(`👤 Creating user: ${employee.email}`);
                    const newUser = await prisma.user.create({
                        data: {
                            name: employee.name,
                            email: employee.email,
                            password: hashedPassword,
                            role: mappedRole as any,
                            employeeType: mappedEmployeeType as any,
                            company: employee.company,
                            phone: employee.phone || null,
                            address: employee.address || null,
                            hourlyRate: employee.hourlyRate ? employee.hourlyRate : null,
                            monthlySalary: employee.monthlySalary ? employee.monthlySalary : null,
                            hourlyWage: employee.hourlyWage ? employee.hourlyWage : null,
                            kvkNumber: employee.kvkNumber || null,
                            btwNumber: employee.btwNumber || null,
                            hasContract: employee.hasContract || false,
                            status: 'AVAILABLE',
                        },
                    });

                    console.log(`✅ User created: ${newUser.id}`);

                    // Create work types if provided
                    if (employee.workTypes && employee.workTypes.length > 0) {
                        console.log(`🔧 Creating work types for: ${employee.email}`);

                        // Get work type IDs from names
                        const workTypeRecords = await prisma.workType.findMany({
                            where: {
                                name: {
                                    in: employee.workTypes
                                }
                            },
                            select: {
                                id: true,
                                name: true
                            }
                        });

                        // Create work type associations with the new schema
                        if (workTypeRecords.length > 0) {
                            await prisma.userWorkType.createMany({
                                data: workTypeRecords.map((workType: any) => ({
                                    userId: newUser.id,
                                    workTypeId: workType.id
                                }))
                            });
                        }

                        console.log(`✅ Work types created for: ${employee.email}`);
                    }

                    results.success++;
                    results.created.push({
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        tempPassword: tempPassword, // Include temp password for admin reference
                    });

                    console.log(`✅ Successfully processed: ${employee.name}`);

                } catch (error) {
                    console.error(`❌ Error creating user ${employee.email}:`, error);
                    results.failed++;
                    results.errors.push(`Rij ${i + 1}: Fout bij aanmaken van ${employee.name} (${employee.email})`);
                }
            }

            console.log('📊 Import completed:', results);

            return NextResponse.json({
                message: `Import voltooid: ${results.success} succesvol, ${results.failed} gefaald`,
                results,
            });
        };

        // Race between the actual process and timeout
        const result = await Promise.race([processRequest(), timeoutPromise]);
        return result;

    } catch (error) {
        console.error('💥 Bulk import error:', error);

        // Check if it's a timeout error
        if (error instanceof Error && error.message === 'Request timeout') {
            return NextResponse.json(
                { error: 'Request timeout - de import duurde te lang. Probeer het opnieuw met minder medewerkers.' },
                { status: 408 }
            );
        }

        return NextResponse.json(
            { error: 'Er is een fout opgetreden bij het importeren' },
            { status: 500 }
        );
    }
} 