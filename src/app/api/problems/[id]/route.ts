import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Problem from '@/models/Problem';
import { getUserFromRequest } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const problem = await Problem.findOne({ _id: id, userId });
        if (!problem) {
            return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: problem });
    } catch (error) {
        console.error('GET /api/problems/[id] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch problem' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const problem = await Problem.findOneAndUpdate({ _id: id, userId }, body, {
            new: true,
            runValidators: true,
        });
        if (!problem) {
            return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: problem });
    } catch (error) {
        console.error('PUT /api/problems/[id] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update problem' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        await connectDB();
        const userId = getUserFromRequest(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const problem = await Problem.findOneAndDelete({ _id: id, userId });
        if (!problem) {
            return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Problem deleted' });
    } catch (error) {
        console.error('DELETE /api/problems/[id] error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete problem' }, { status: 500 });
    }
}
