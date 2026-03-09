import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Problem from '@/models/Problem';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const userId = getUserFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Use MongoDB aggregation to get all unique categories across the user's problems
        const categories = await Problem.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: "$categories" },
            { $group: { _id: "$categories" } },
            { $sort: { _id: 1 } }
        ]);

        const extractedCategories = categories.map(c => c._id).filter(Boolean);

        return NextResponse.json({ success: true, data: extractedCategories }, { status: 200 });
    } catch (error) {
        console.error('GET /api/categories error:', error);
        return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
    }
}
