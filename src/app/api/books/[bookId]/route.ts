import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';
import Page from '@/models/Page';
import { getUserFromRequest } from '@/lib/auth';

// GET a single book
export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId } = await params;
        const book = await Book.findOne({ _id: bookId, userId });
        if (!book) {
            return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: book });
    } catch (error) {
        console.error('GET /api/books/[bookId] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch book' }, { status: 500 });
    }
}

// UPDATE a book
export async function PUT(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId } = await params;
        const body = await req.json();
        const book = await Book.findOneAndUpdate(
            { _id: bookId, userId },
            body,
            { new: true }
        );

        if (!book) {
            return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: book });
    } catch (error) {
        console.error('PUT /api/books/[bookId] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update book' }, { status: 500 });
    }
}

// DELETE a book and all its chapters + pages
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId } = await params;

        // Delete all pages and chapters in this book
        await Page.deleteMany({ bookId, userId });
        await Chapter.deleteMany({ bookId, userId });
        await Book.findOneAndDelete({ _id: bookId, userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/books/[bookId] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete book' }, { status: 500 });
    }
}
