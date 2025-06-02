import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employeeId = params.id;

        // Get documents for this employee
        const documents = await prisma.document.findMany({
            where: {
                userId: employeeId,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                type: true,
                title: true,
                filename: true,
                size: true,
                uploadedAt: true,
                uploadedBy: true,
                status: true
            },
            orderBy: {
                uploadedAt: 'desc'
            }
        });

        return NextResponse.json(documents);

    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employeeId = params.id;
        const formData = await request.formData();

        const file = formData.get('file') as File;
        const type = formData.get('type') as string;
        const title = formData.get('title') as string;

        if (!file || !type || !title) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large (max 10MB)' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type' },
                { status: 400 }
            );
        }

        // Create unique filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${randomUUID()}.${fileExtension}`;

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'uploads', 'documents', employeeId);
        await mkdir(uploadDir, { recursive: true });

        // Write file to disk
        const filePath = join(uploadDir, uniqueFilename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Save document metadata to database
        const document = await prisma.document.create({
            data: {
                userId: employeeId,
                type: type,
                title: title,
                filename: uniqueFilename,
                originalName: file.name,
                filePath: filePath,
                size: file.size,
                mimeType: file.type,
                uploadedBy: session.user.email!,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({
            id: document.id,
            type: document.type,
            title: document.title,
            filename: document.filename,
            size: document.size,
            uploadedAt: document.uploadedAt,
            uploadedBy: document.uploadedBy,
            status: document.status
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 