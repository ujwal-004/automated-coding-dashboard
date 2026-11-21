# Automated Coding & Assessment Dashboard

A Next.js-based coding practice dashboard that integrates with [Judge0 CE](https://judge0.com/) to execute and evaluate code in multiple languages. Write a solution, submit it, and see the output, compilation errors, and test results — all in the browser.

> **⚠️ Security Notice:** This tool executes untrusted code via a third-party Judge0 service. It is designed for **practice and education only**, not as a secure sandbox. Do not use it for sensitive or production workloads.

---

## Features

- **Multi-language support:** JavaScript (Node.js), Python, C++, Java
- **Monaco Editor:** Full code editor with syntax highlighting, built into the browser via `@monaco-editor/react`
- **Problem list:** Pre-loaded coding problems with sample input / expected output
- **Execution console:** Displays stdout, stderr, and compile output from Judge0
- **Test evaluation:** Auto-compares your code's output against expected output
- **Configurable Judge0 endpoint:** Set `JUDGE0_BASE_URL` to point to a self-hosted instance

## Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.js            # Frontend UI (problems, editor, console)
│   │   └── api/
│   │       └── execute/
│   │           └── route.js   # API route → forwards code to Judge0
│   └── ...
├── package.json
├── .env.example               # Optional environment variable template
└── README.md
```

- **`src/app/page.js`** — Client-side React component using the Monaco Editor (`@monaco-editor/react`). Sends `{ language, code }` to the local `/api/execute` endpoint.
- **`src/app/api/execute/route.js`** — Next.js API route (App Router) that validates the request body, forwards the code to the Judge0 CE submission endpoint (`/submissions?wait=true&tokens=true`), and returns a stable JSON response.

## Supported Languages & Judge0 IDs

| Language   | Judge0 ID | Runtime / Compiler          |
|------------|:---------:|-----------------------------|
| JavaScript | 63        | Node.js 10.16.0             |
| Python     | 71        | Python 3.8.1                |
| C++        | 54        | C++ (GCC 9.2.0)             |
| Java       | 62        | Java (OpenJDK 13.0.1)       |

## Install & Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev          # http://localhost:3000
```

## Build & Production

```bash
# Build the application for production
npm run build

# Start the production server
npm start
```

## Linting

```bash
npm run lint
```

## Environment Variables

| Variable             | Required | Default                          | Description                        |
|----------------------|:--------:|----------------------------------|------------------------------------|
| `JUDGE0_BASE_URL`    | No       | `https://ce.judge0.com`          | Base URL of the Judge0 CE instance |

### `.env` (or `.env.local`)

```env
JUDGE0_BASE_URL=http://localhost:2358
```

For deployment on Vercel or similar platforms, set the environment variable in your platform's dashboard settings.

## API

### Endpoint

```
POST /api/execute
```

### Request Body

```json
{
  "language": "javascript",
  "code": "console.log(5 + 7);"
}
```

- `language` — one of: `javascript`, `python`, `cpp`, `java`
- `code` — non-empty string, max 50 KB

### Response (200 OK)

```json
{
  "stdout": "12",
  "stderr": "",
  "compile_output": "",
  "status": {
    "id": 3,
    "description": "Accepted"
  },
  "time": "0.012",
  "memory": 8192
}
```

### Error Responses

| Status | Meaning                                           |
|:------:|---------------------------------------------------|
| `400`  | Invalid JSON, missing fields, unsupported language, or code exceeds 50 KB |
| `400`  | Unsupported language                              |
| `502`  | Judge0 returned a non-OK response or unexpected error |
| `504`  | Judge0 timed out (60 s default) or unreachable    |

## Security Limitations

1. **Untrusted code execution:** Code is sent to a third-party Judge0 service. The dashboard **does not sandbox** execution locally.
2. **No secret exposure:** The Judge0 base URL is configurable via server-side environment variables only — no keys or secrets are sent to the browser.
3. **Code size limit:** Maximum 50 KB to prevent abuse.
4. **Timeout:** Requests to Judge0 are capped at 60 seconds to avoid hanging connections.
