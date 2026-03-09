import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export function getUserFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch (e) {
        return null;
    }
}
