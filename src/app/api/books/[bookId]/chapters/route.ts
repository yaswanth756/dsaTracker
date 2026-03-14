import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chapter from '@/models/Chapter';
import { getUserFromRequest } from '@/lib/auth';

// GET all chapters of a book
export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId } = await params;
        const chapters = await Chapter.find({ bookId, userId }).sort({ order: 1 });
        return NextResponse.json({ success: true, data: chapters });
    } catch (error) {
        console.error('GET chapters error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch chapters' }, { status: 500 });
    }
}

// CREATE a new chapter
export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId } = await params;
        const body = await req.json();

        // Auto-set order to be the last
        const count = await Chapter.countDocuments({ bookId, userId });

        const chapter = await Chapter.create({
            ...body,
            bookId,
            userId,
            order: count,
        });
        return NextResponse.json({ success: true, data: chapter }, { status: 201 });
    } catch (error) {
        console.error('POST chapters error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create chapter' }, { status: 500 });
    }
}
