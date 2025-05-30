import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            address,
            phone,
            role,
            availableDays,
            kvkNumber,
            btwNumber,
            iban
        } = await request.json();

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !address || !phone) {
            return NextResponse.json(
                { error: 'Alle verplichte velden moeten worden ingevuld' },
                { status: 400 }
            );
        }

        // Validate role-specific fields
        if (role === 'FREELANCER') {
            if (!kvkNumber || !btwNumber || !iban) {
                return NextResponse.json(
                    { error: 'Voor freelancers zijn KVK nummer, BTW nummer en IBAN verplicht' },
                    { status: 400 }
                );
            }
        } else if (role === 'EMPLOYEE') {
            if (!availableDays) {
                return NextResponse.json(
                    { error: 'Voor medewerkers/oproepkrachten zijn beschikbare dagen verplicht' },
                    { status: 400 }
                );
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Gebruiker met dit e-mailadres bestaat al' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`, // Keep name field for compatibility
                email,
                password: hashedPassword,
                role: role || 'FREELANCER',
                status: 'AVAILABLE',
                address,
                phone,
                availableDays: role === 'EMPLOYEE' ? availableDays : null,
                kvkNumber: role === 'FREELANCER' ? kvkNumber : null,
                btwNumber: role === 'FREELANCER' ? btwNumber : null,
                iban: role === 'FREELANCER' ? iban : null,
            },
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan bij het registreren' },
            { status: 500 }
        );
    }
} 