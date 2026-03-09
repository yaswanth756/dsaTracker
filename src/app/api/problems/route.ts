import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Problem from '@/models/Problem';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        const query: Record<string, unknown> = { userId };

        const search = searchParams.get('search');
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { categories: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        const category = searchParams.get('category');
        if (category && category !== 'all') {
            query.categories = { $in: [category] };
        }

        const difficulty = searchParams.get('difficulty');
        if (difficulty && difficulty !== 'all') {
            query.difficulty = difficulty;
        }

        const status = searchParams.get('status');
        if (status && status !== 'all') {
            query.status = status;
        }

        const platform = searchParams.get('platform');
        if (platform && platform !== 'all') {
            query.platform = platform;
        }

        const favorite = searchParams.get('favorite');
        if (favorite === 'true') {
            query.isFavorite = true;
        }

        const problems = await Problem.find(query).sort({ updatedAt: -1 });
        return NextResponse.json({ success: true, data: problems });
    } catch (error) {
        console.error('GET /api/problems error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch problems' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const problem = await Problem.create({ ...body, userId });
        return NextResponse.json({ success: true, data: problem }, { status: 201 });
    } catch (error) {
        console.error('POST /api/problems error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create problem' }, { status: 500 });
    }
}
