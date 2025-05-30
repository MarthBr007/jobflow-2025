import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create unique filename
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const filename = `profile-${user.id}-${timestamp}${extension}`;

        // Save file to public/uploads directory
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile');

        try {
            await writeFile(path.join(uploadsDir, filename), buffer);
        } catch (error) {
            // If directory doesn't exist, create it and try again
            const fs = require('fs');
            fs.mkdirSync(uploadsDir, { recursive: true });
            await writeFile(path.join(uploadsDir, filename), buffer);
        }

        const imageUrl = `/uploads/profile/${filename}`;

        // Delete old profile image if exists
        if (user.profileImage) {
            const oldImagePath = path.join(process.cwd(), 'public', user.profileImage);
            try {
                await unlink(oldImagePath);
            } catch (error) {
                // Ignore error if file doesn't exist
                console.log('Old image file not found or could not be deleted');
            }
        }

        // Update user profile with new image URL
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { profileImage: imageUrl }
        });

        return NextResponse.json({
            imageUrl,
            message: 'Profile image uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete profile image file if exists
        if (user.profileImage) {
            const imagePath = path.join(process.cwd(), 'public', user.profileImage);
            try {
                await unlink(imagePath);
            } catch (error) {
                // Ignore error if file doesn't exist
                console.log('Image file not found or could not be deleted');
            }
        }

        // Remove image URL from database
        await prisma.user.update({
            where: { id: user.id },
            data: { profileImage: null }
        });

        return NextResponse.json({
            message: 'Profile image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        );
    }
} 