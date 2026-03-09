import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { link, platform } = await req.json();

        if (!link) {
            return NextResponse.json({ success: false, error: 'Link is required' }, { status: 400 });
        }

        if (platform === 'leetcode') {
            const urlObj = new URL(link);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            let titleSlug = '';

            if (pathParts[0] === 'problems' && pathParts[1]) {
                titleSlug = pathParts[1];
            } else {
                titleSlug = pathParts[0];
            }

            if (!titleSlug) {
                return NextResponse.json({ success: false, error: 'Invalid LeetCode URL' }, { status: 400 });
            }

            const query = `
                query questionData($titleSlug: String!) {
                    question(titleSlug: $titleSlug) {
                        content
                        title
                    }
                }
            `;

            const res = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com/',
                },
                body: JSON.stringify({
                    query,
                    variables: { titleSlug }
                })
            });

            const data = await res.json();

            if (data.data?.question?.content) {
                return NextResponse.json({
                    success: true,
                    title: data.data.question.title,
                    content: data.data.question.content
                });
            } else {
                return NextResponse.json({ success: false, error: 'Could not fetch problem data' }, { status: 404 });
            }
        } else if (platform === 'gfg') {
            const urlObj = new URL(link);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            let titleSlug = '';

            if (pathParts[0] === 'problems' && pathParts[1]) {
                titleSlug = pathParts[1];
            } else {
                return NextResponse.json({ success: false, error: 'Invalid GFG URL' }, { status: 400 });
            }

            const res = await fetch(`https://practiceapi.geeksforgeeks.org/api/vr/problems/${titleSlug}/`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!res.ok) {
                return NextResponse.json({ success: false, error: 'Could not fetch GFG problem data' }, { status: res.status });
            }

            const data = await res.json();
            const problem = data.results || data.result;

            if (problem && problem.problem_question) {
                return NextResponse.json({
                    success: true,
                    title: problem.problem_name,
                    content: problem.problem_question
                });
            } else {
                return NextResponse.json({ success: false, error: 'Could not parse GFG problem data' }, { status: 404 });
            }
        }

        return NextResponse.json({ success: false, error: 'Unsupported platform' }, { status: 400 });

    } catch (error) {
        console.error('Error fetching description:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
    }
}
