import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Check against environment variables
    const validUsername = process.env.DEMO_USERNAME;
    const validPassword = process.env.DEMO_PASSWORD;

    if (username === validUsername && password === validPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set HTTP-only cookie (more secure)
      response.cookies.set('demo-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}