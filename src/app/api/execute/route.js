import { NextResponse } from 'next/server';

// Language IDs recognized by Judge0 API
const JUDGE0_LANGUAGE_IDS = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
};

export async function POST(request) {
  try {
    const { language, code } = await request.json();
    const languageId = JUDGE0_LANGUAGE_IDS[language] || 63;

    // Send code to Judge0 submission endpoint
    const response = await fetch(
      'https://ce.judge0.com/submissions?wait=true',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Server connection failed.' },
      { status: 500 }
    );
  }
}