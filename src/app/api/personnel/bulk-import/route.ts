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
    bsnNumber?: string;
    hourlyRate?: string;
    monthlySalary?: string;
    hourlyWage?: string;
    workTypes?: string[];
    kvkNumber?: string;
    btwNumber?: string;
    hasContract?: boolean;
    iban?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
    console.log('🚀 Starting bulk import process...');

    try {
        console.log('🔐 Checking session...');
        const session = await getServerSession(authOptions);

        console.log('🔍 Session details:', {
            hasSession: !!session,
            userEmail: session?.user?.email,
            expires: session?.expires
        });

        if (!session?.user?.email) {
            console.log('❌ No session found or no email in session');
            return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 });
        }

        console.log('✅ Session found for:', session.user.email);

        // Check if user has permission to create users - simplified check
        console.log('🔍 Looking up user in database...');
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, role: true, company: true, archived: true, status: true },
        });

        console.log('🔍 Database user lookup result:', currentUser);

        if (!currentUser) {
            console.log('❌ User not found in database for email:', session.user.email);
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        if (currentUser.archived) {
            console.log('❌ User is archived:', session.user.email);
            return NextResponse.json({ error: 'User account is archived' }, { status: 403 });
        }

        // Simple role check - only ADMIN or MANAGER can import users
        console.log('🔍 Checking user role:', currentUser.role);
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
            console.log('❌ Unauthorized access attempt - role:', currentUser.role);
            return NextResponse.json({ error: `Access denied - Admin or Manager role required. Current role: ${currentUser.role}` }, { status: 403 });
        }

        console.log('✅ User authorized:', session.user.email, 'Role:', currentUser.role);

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

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];
            console.log(`🔄 Processing employee ${i + 1}/${employees.length}: ${employee.email}`);

            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: employee.email },
                });

                if (existingUser) {
                    console.log(`⚠️ User already exists: ${employee.email}`);
                    results.failed++;
                    results.errors.push(`User with email ${employee.email} already exists`);
                    continue;
                }

                // Map role to valid Prisma enum values
                let mappedRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER' = 'FREELANCER';
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
                let mappedEmployeeType: 'PERMANENT' | 'FREELANCER' | 'FLEX_WORKER' = 'FREELANCER';
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
                const tempPassword = 'changeme123';
                const hashedPassword = await bcrypt.hash(tempPassword, 12);

                // Create user
                console.log(`👤 Creating user: ${employee.email}`);
                const newUser = await prisma.user.create({
                    data: {
                        name: employee.name,
                        email: employee.email,
                        password: hashedPassword,
                        role: mappedRole,
                        employeeType: mappedEmployeeType,
                        company: employee.company,
                        phone: employee.phone || null,
                        address: employee.address || null,
                        bsnNumber: employee.bsnNumber || null,
                        hourlyRate: employee.hourlyRate || null,
                        monthlySalary: employee.monthlySalary || null,
                        hourlyWage: employee.hourlyWage || null,
                        kvkNumber: employee.kvkNumber || null,
                        btwNumber: employee.btwNumber || null,
                        iban: employee.iban || null,
                        hasContract: employee.hasContract || false,
                        status: 'AVAILABLE',
                    },
                });

                console.log(`✅ User created: ${newUser.id}`);

                results.success++;
                results.created.push({
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    employeeType: newUser.employeeType,
                    company: newUser.company,
                    tempPassword: tempPassword
                });

            } catch (employeeError) {
                console.error(`❌ Error creating employee ${employee.email}:`, employeeError);
                results.failed++;
                results.errors.push(`Failed to create ${employee.email}: ${employeeError instanceof Error ? employeeError.message : 'Unknown error'}`);
            }
        }

        console.log(`✅ Import completed. Success: ${results.success}, Failed: ${results.failed}`);

        return NextResponse.json({
            success: true,
            message: `Import completed. Created ${results.success} users, ${results.failed} failed.`,
            results: results,
        });

    } catch (error) {
        console.error('❌ Bulk import error:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 