import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const status = url.searchParams.get('status');
        const expiringIn = url.searchParams.get('expiringIn'); // days

        const whereClause: any = {};

        if (userId) {
            whereClause.userId = userId;
        }

        if (status) {
            whereClause.status = status;
        }

        // Filter contracts expiring in X days
        if (expiringIn) {
            const days = parseInt(expiringIn);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            whereClause.endDate = {
                lte: futureDate,
                gte: new Date()
            };
            whereClause.status = 'ACTIVE';
        }

        const contracts = await prisma.contract.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true,
                        employeeType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform user names
        const transformedContracts = contracts.map(contract => ({
            ...contract,
            user: {
                ...contract.user,
                name: contract.user.firstName && contract.user.lastName
                    ? `${contract.user.firstName} ${contract.user.lastName}`.trim()
                    : contract.user.name || contract.user.email.split('@')[0]
            }
        }));

        return NextResponse.json(transformedContracts);
    } catch (error) {
        console.error('Error fetching contracts:', error);
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
        const {
            userId,
            contractType,
            title,
            description,
            startDate,
            endDate,
            status = 'DRAFT',
            salary,
            notes,
            signedDate,
            fileName,
            fileUrl,
            fileSize,
            mimeType
        } = body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Create the contract
        const contract = await prisma.contract.create({
            data: {
                userId,
                contractType,
                title,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status,
                salary,
                notes,
                signedDate: signedDate ? new Date(signedDate) : null,
                fileName,
                fileUrl,
                fileSize,
                mimeType,
                uploadedAt: fileName ? new Date() : null,
                createdBy: session.user.id || session.user.email
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true,
                        employeeType: true
                    }
                }
            }
        });

        // Update user contract status if this is an active contract
        if (status === 'ACTIVE') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    hasContract: true,
                    contractType,
                    contractStartDate: new Date(startDate),
                    contractEndDate: endDate ? new Date(endDate) : null,
                    contractStatus: status,
                    contractFileName: fileName,
                    contractFileUrl: fileUrl,
                    contractNotes: notes
                }
            });
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 