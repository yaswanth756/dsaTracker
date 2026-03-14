import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import { getUserFromRequest } from '@/lib/auth';

// GET all books for user
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const books = await Book.find({ userId }).sort({ updatedAt: -1 });
        return NextResponse.json({ success: true, data: books });
    } catch (error) {
        console.error('GET /api/books error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch books' }, { status: 500 });
    }
}

// CREATE a new book
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const book = await Book.create({ ...body, userId });
        return NextResponse.json({ success: true, data: book }, { status: 201 });
    } catch (error) {
        console.error('POST /api/books error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create book' }, { status: 500 });
    }
}
