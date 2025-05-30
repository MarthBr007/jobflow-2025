import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contract = await prisma.contract.findUnique({
            where: { id: params.id },
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

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            );
        }

        // Transform user name
        const transformedContract = {
            ...contract,
            user: {
                ...contract.user,
                name: contract.user.firstName && contract.user.lastName
                    ? `${contract.user.firstName} ${contract.user.lastName}`.trim()
                    : contract.user.name || contract.user.email.split('@')[0]
            }
        };

        return NextResponse.json(transformedContract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

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
        const {
            contractType,
            title,
            description,
            startDate,
            endDate,
            status,
            salary,
            notes,
            signedDate,
            fileName,
            fileUrl,
            fileSize,
            mimeType
        } = body;

        // Check if contract exists
        const existingContract = await prisma.contract.findUnique({
            where: { id: params.id },
            include: { user: true }
        });

        if (!existingContract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            );
        }

        // Update the contract
        const contract = await prisma.contract.update({
            where: { id: params.id },
            data: {
                contractType,
                title,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                status,
                salary,
                notes,
                signedDate: signedDate ? new Date(signedDate) : null,
                fileName,
                fileUrl,
                fileSize,
                mimeType,
                uploadedAt: fileName && !existingContract.fileName ? new Date() : undefined,
                updatedAt: new Date()
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

        // Update user contract status if this is the active contract
        if (status === 'ACTIVE') {
            await prisma.user.update({
                where: { id: existingContract.userId },
                data: {
                    hasContract: true,
                    contractType,
                    contractStartDate: startDate ? new Date(startDate) : undefined,
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
        console.error('Error updating contract:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if contract exists
        const existingContract = await prisma.contract.findUnique({
            where: { id: params.id }
        });

        if (!existingContract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            );
        }

        // Delete the contract
        await prisma.contract.delete({
            where: { id: params.id }
        });

        // Check if this was the active contract and update user
        if (existingContract.status === 'ACTIVE') {
            // Check if user has other active contracts
            const otherActiveContracts = await prisma.contract.findMany({
                where: {
                    userId: existingContract.userId,
                    status: 'ACTIVE',
                    id: { not: params.id }
                }
            });

            if (otherActiveContracts.length === 0) {
                // No other active contracts, update user status
                await prisma.user.update({
                    where: { id: existingContract.userId },
                    data: {
                        hasContract: false,
                        contractType: null,
                        contractStartDate: null,
                        contractEndDate: null,
                        contractStatus: 'NONE',
                        contractFileName: null,
                        contractFileUrl: null,
                        contractNotes: null
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Contract successfully deleted'
        });
    } catch (error) {
        console.error('Error deleting contract:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 