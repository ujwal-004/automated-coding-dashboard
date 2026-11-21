import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// This route forwards untrusted source code to Judge0 CE. This is an
// educational practice tool, not a security boundary or local sandbox.
const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
};

const MAX_CODE_BYTES = 50 * 1024;
const MAX_STDIN_BYTES = 10 * 1024;
const JUDGE0_BASE_URL = (process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com').replace(/\/$/, '');
const JUDGE0_TIMEOUT_MS = 60_000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { language, code } = body;
  const stdin = body.stdin ?? '';

  if (!Object.hasOwn(JUDGE0_LANGUAGE_IDS, language)) {
    return NextResponse.json({
      error: 'Unsupported language. Choose JavaScript, Python, C++ or Java.',
    }, { status: 400 });
  }

  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'Field "code" must be a non-empty string.' }, { status: 400 });
  }

  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return NextResponse.json({ error: 'Code exceeds the 50 KB limit.' }, { status: 400 });
  }

  if (typeof stdin !== 'string' || Buffer.byteLength(stdin, 'utf8') > MAX_STDIN_BYTES) {
    return NextResponse.json({ error: 'Sample input must be text no larger than 10 KB.' }, { status: 400 });
  }

  try {
    const judge0Response = await fetch(
      `${JUDGE0_BASE_URL}/submissions?wait=true&tokens=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_id: JUDGE0_LANGUAGE_IDS[language],
          source_code: code,
          stdin,
        }),
        signal: AbortSignal.timeout(JUDGE0_TIMEOUT_MS),
        cache: 'no-store',
      },
    );

    if (!judge0Response.ok) {
      let detail = 'Judge0 service returned an error.';
      try {
        const upstreamError = await judge0Response.json();
        if (typeof upstreamError.error === 'string') detail = upstreamError.error;
      } catch {
        // The upstream body may not be JSON.
      }
      return NextResponse.json(
        { error: detail },
        { status: judge0Response.status >= 500 ? 502 : 400 },
      );
    }

    const data = await judge0Response.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Judge0 returned an invalid response.' }, { status: 502 });
    }

    return NextResponse.json({
      stdout: data.stdout ?? '',
      stderr: data.stderr ?? '',
      compile_output: data.compile_output ?? '',
      status: {
        id: data.status?.id ?? null,
        description: data.status?.description ?? 'Unknown',
      },
      time: data.time ?? null,
      memory: data.memory ?? null,
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return NextResponse.json({ error: 'Judge0 execution timed out after 60 seconds.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Judge0 is unavailable or returned an unexpected response.' }, { status: 502 });
  }
}
