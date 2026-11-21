import { NextResponse } from 'next/server';

// ============================================================
// SECURITY NOTE
// This API executes untrusted code via a third-party Judge0 CE
// service (e.g. ce.judge0.com or a self-hosted instance). It is
// a practice/educational tool only — it is NOT a secure sandbox.
// Never expose Judge0 provider keys or secrets in browser code.
// ============================================================

/**
 * Judge0 language ID mappings for the supported languages.
 * These match the Judge0 CE defaults documented at:
 * https://ce.judge0.com/
 *
 *  javascript  → 63  (Node.js 10.16.0)
 *  python      → 71  (Python 3.8.1)
 *  cpp         → 54  (C++ (GCC 9.2.0))
 *  java        → 62  (Java (OpenJDK 13.0.1))
 */
const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,
  python:     71,
  cpp:        54,
  java:       62,
};

const SUPPORTED_LANGUAGES = Object.keys(JUDGE0_LANGUAGE_IDS);
const MAX_CODE_BYTES = 50 * 1024; // 50 KB
const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com';
const JUDGE0_TIMEOUT_MS = 60_000; // 60 seconds

export async function POST(request) {
  // ---------- parse and validate request body ----------
  let parsedBody;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 },
    );
  }

  const { language, code } = parsedBody;

  // Validate language
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return NextResponse.json(
      {
        error: `Unsupported language "${language}". `
          + `Supported: ${SUPPORTED_LANGUAGES.join(', ')}.`,
      },
      { status: 400 },
    );
  }

  // Validate code
  if (typeof code !== 'string' || code.length === 0) {
    return NextResponse.json(
      { error: 'Field "code" must be a non-empty string.' },
      { status: 400 },
    );
  }

  if (Buffer.byteLength(code, 'utf-8') > MAX_CODE_BYTES) {
    return NextResponse.json(
      { error: `Code exceeds maximum size of ${MAX_CODE_BYTES / 1024} KB.` },
      { status: 400 },
    );
  }

  const languageId = JUDGE0_LANGUAGE_IDS[language];

  // ---------- submit to Judge0 with timeout ----------
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JUDGE0_TIMEOUT_MS);

    const judge0Response = await fetch(
      `${JUDGE0_BASE_URL}/submissions?wait=true&tokens=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language_id: languageId,
          source_code: code,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!judge0Response.ok) {
      // Try to read an error from the upstream response
      let detail = 'Judge0 service returned an error.';
      try {
        const errData = await judge0Response.json();
        detail = errData.error || detail;
      } catch { /* ignore */ }

      return NextResponse.json(
        {
          error: detail,
          status: judge0Response.status,
        },
        { status: judge0Response.status >= 500 ? 502 : 400 },
      );
    }

    const data = await judge0Response.json();

    // ---------- normalise the response ----------
    const statusId = data.status?.id ?? null;
    const statusDescription = data.status?.description ?? 'Unknown';

    // Compile output may appear in compile_output or stdout
    const compileOutput = data.compile_output || '';

    // Execution output
    let stdout = data.stdout || '';
    let stderr = data.stderr || '';

    // If stdout is null/missing but there's an error status,
    // surface stderr or a status message instead.
    if (statusId && statusId >= 6 && !stdout) {
      stdout = stderr || `Exit status: ${statusDescription}.`;
      stderr = '';
    }

    return NextResponse.json({
      stdout:   stdout ?? '',
      stderr:   stderr ?? '',
      compile_output: compileOutput ?? '',
      status: {
        id:   statusId,
        description: statusDescription,
      },
      time: data.time ?? null,
      memory: data.memory ?? null,
    });

  } catch (err) {
    // Timeout, network failure, etc.
    if (err.name === 'AbortError' || err.message?.includes('fetch failed') || err.message?.includes('network')) {
      return NextResponse.json(
        { error: 'Judge0 service timed out or is unreachable.' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred while contacting Judge0.' },
      { status: 502 },
    );
  }
}
