import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chapter from '@/models/Chapter';
import Page from '@/models/Page';
import { getUserFromRequest } from '@/lib/auth';

// UPDATE a chapter
export async function PUT(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { chapterId } = await params;
        const body = await req.json();
        const chapter = await Chapter.findOneAndUpdate(
            { _id: chapterId, userId },
            body,
            { new: true }
        );

        if (!chapter) {
            return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: chapter });
    } catch (error) {
        console.error('PUT chapter error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update chapter' }, { status: 500 });
    }
}

// DELETE a chapter and its pages
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { chapterId } = await params;
        await Page.deleteMany({ chapterId, userId });
        await Chapter.findOneAndDelete({ _id: chapterId, userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE chapter error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete chapter' }, { status: 500 });
    }
}
