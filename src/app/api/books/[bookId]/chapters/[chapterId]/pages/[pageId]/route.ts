import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Page from '@/models/Page';
import { getUserFromRequest } from '@/lib/auth';

// GET a single page
export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string; pageId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;
        const page = await Page.findOne({ _id: pageId, userId });
        if (!page) {
            return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: page });
    } catch (error) {
        console.error('GET page error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch page' }, { status: 500 });
    }
}

// UPDATE a page (title, content, emoji)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string; pageId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;
        const body = await req.json();
        const page = await Page.findOneAndUpdate(
            { _id: pageId, userId },
            body,
            { new: true }
        );

        if (!page) {
            return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: page });
    } catch (error) {
        console.error('PUT page error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update page' }, { status: 500 });
    }
}

// DELETE a page
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string; chapterId: string; pageId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;
        await Page.findOneAndDelete({ _id: pageId, userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE page error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete page' }, { status: 500 });
    }
}
