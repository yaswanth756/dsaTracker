import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Page from '@/models/Page';
import { getUserFromRequest } from '@/lib/auth';

// GET all pages of a chapter
export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId, chapterId } = await params;
        const pages = await Page.find({ bookId, chapterId, userId }).sort({ order: 1 });
        return NextResponse.json({ success: true, data: pages });
    } catch (error) {
        console.error('GET pages error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 });
    }
}

// CREATE a new page
export async function POST(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId, chapterId } = await params;
        const body = await req.json();

        const count = await Page.countDocuments({ chapterId, userId });

        const page = await Page.create({
            ...body,
            bookId,
            chapterId,
            userId,
            order: count,
            title: body.title || 'Untitled',
        });
        return NextResponse.json({ success: true, data: page }, { status: 201 });
    } catch (error) {
        console.error('POST pages error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create page' }, { status: 500 });
    }
}
