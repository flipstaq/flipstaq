import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const { id, action } = params;

    if (!['resolve', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be resolve or dismiss' },
        { status: 400 }
      );
    }

    // Get auth token from cookies or headers
    const authHeader = request.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward to API Gateway (admin only)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/reports/${id}/${action}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error ${params.action}ing report:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
