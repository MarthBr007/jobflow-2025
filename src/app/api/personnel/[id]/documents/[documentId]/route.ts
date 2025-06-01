import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; documentId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: employeeId, documentId } = params;

        // Get document info first
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                userId: employeeId
            }
        });

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Delete file from filesystem
        try {
            if (document.filePath) {
                await unlink(document.filePath);
            }
        } catch (fileError) {
            console.warn('Could not delete file from filesystem:', fileError);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database
        await prisma.document.delete({
            where: {
                id: documentId
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 