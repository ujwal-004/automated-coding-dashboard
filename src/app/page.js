'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

const PROBLEMS = [
  {
    id: 'add-two-numbers',
    title: '1. Add Two Numbers',
    difficulty: 'Easy',
    description: 'Read two integers from standard input and print their sum.',
    sampleInput: '5 7',
    expectedOutput: '12',
    starters: {
      javascript: "const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);",
      python: 'a, b = map(int, input().split())\nprint(a + b)',
      cpp: '#include <iostream>\nint main() { int a, b; std::cin >> a >> b; std::cout << a + b << \'\\n\'; return 0; }',
      java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n    System.out.println(a + b);\n  }\n}',
    },
  },
  {
    id: 'reverse-string',
    title: '2. Reverse a String',
    difficulty: 'Easy',
    description: 'Read a line of text and print it in reverse order.',
    sampleInput: 'hello',
    expectedOutput: 'olleh',
    starters: {
      javascript: "const fs = require('fs');\nconst value = fs.readFileSync(0, 'utf8').trimEnd();\nconsole.log([...value].reverse().join(''));",
      python: 'value = input()\nprint(value[::-1])',
      cpp: '#include <algorithm>\n#include <iostream>\n#include <string>\nint main() { std::string value; std::getline(std::cin, value); std::reverse(value.begin(), value.end()); std::cout << value << \'\\n\'; }',
      java: 'import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String value = scanner.nextLine();\n    System.out.println(new StringBuilder(value).reverse());\n  }\n}',
    },
  },
];

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
];

function getResult(data) {
  if (!data) return { message: 'No response received.', passed: false };

  const statusId = data.status?.id;
  const statusDescription = data.status?.description ?? 'Unknown status';
  const sections = [];

  if (data.compile_output) sections.push(`[Compile]\n${data.compile_output.trimEnd()}`);
  if (data.stdout) sections.push(`[Output]\n${data.stdout.trimEnd()}`);
  if (data.stderr) sections.push(`[Stderr]\n${data.stderr.trimEnd()}`);
  if (sections.length === 0) sections.push(statusDescription);

  return {
    message: sections.join('\n\n'),
    passed: statusId === 3,
    status: statusDescription,
  };
}

export default function Home() {
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(PROBLEMS[0].starters.javascript);
  const [stdin, setStdin] = useState(PROBLEMS[0].sampleInput);
  const [expectedOutput, setExpectedOutput] = useState(PROBLEMS[0].expectedOutput);
  const [output, setOutput] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProblemChange = (problem) => {
    setSelectedProblem(problem);
    setCode(problem.starters[language] || '');
    setStdin(problem.sampleInput);
    setExpectedOutput(problem.expectedOutput);
    setOutput('');
    setTestResult(null);
  };

  const handleLanguageChange = (event) => {
    const selected = event.target.value;
    setLanguage(selected);
    setCode(selectedProblem.starters[selected] || '');
    setOutput('');
    setTestResult(null);
  };

  const handleRunCode = async () => {
    if (loading) return;

    setLoading(true);
    setOutput('Running your solution on Judge0...');
    setTestResult(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setOutput(data.error || `Execution request failed (${response.status}).`);
        setTestResult('FAILED');
        return;
      }

      const result = getResult(data);
      setOutput(result.message);
      const actual = String(data.stdout ?? '').trim();
      const expected = expectedOutput.trim();
      setTestResult(result.passed && actual === expected ? 'PASSED' : 'FAILED');
    } catch {
      setOutput('Could not reach the coding execution service. Check the app server and Judge0 endpoint.');
      setTestResult('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <header className="border-b border-slate-700 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Automated Coding &amp; Assessment Dashboard</h1>
        <p className="text-sm text-slate-400">Choose a challenge, edit a solution and compare its output with the sample result.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2" htmlFor="problem-list">
              Select Problem
            </label>
            <div id="problem-list" className="space-y-2">
              {PROBLEMS.map((problem) => (
                <button
                  key={problem.id}
                  type="button"
                  onClick={() => handleProblemChange(problem)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedProblem.id === problem.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {problem.title}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-700" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">{selectedProblem.title}</h2>
              <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-semibold">
                {selectedProblem.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-300 mb-4">{selectedProblem.description}</p>
            <div className="bg-slate-900 p-3 rounded text-xs space-y-2 border border-slate-700">
              <div>
                <label htmlFor="expected-output" className="text-slate-400 font-bold block mb-2">Expected Output (editable):</label>
                <textarea
                  id="expected-output"
                  value={expectedOutput}
                  onChange={(event) => setExpectedOutput(event.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 text-green-300 border border-slate-700 rounded p-2 font-mono"
                />
              </div>
            </div>
            <label htmlFor="stdin" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mt-4 mb-2">
              Sample Input (editable)
            </label>
            <textarea
              id="stdin"
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              rows={3}
              className="w-full bg-slate-900 text-blue-200 border border-slate-700 rounded p-3 font-mono text-sm"
            />
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium" htmlFor="language">Language:</label>
              <select
                id="language"
                value={language}
                onChange={handleLanguageChange}
                className="bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={handleRunCode}
              disabled={loading}
              className={`font-semibold px-5 py-1.5 rounded text-sm transition-colors ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
            >
              {loading ? 'Evaluating...' : 'Submit & Test'}
            </button>
          </div>

          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <Editor
              height="380px"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
            />
          </div>

          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Execution Console</h3>
              {testResult === 'PASSED' && <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">✓ PASSED</span>}
              {testResult === 'FAILED' && <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">✕ FAILED</span>}
            </div>
            <pre className="bg-slate-950 p-3 rounded text-green-400 text-sm font-mono overflow-x-auto min-h-[90px] whitespace-pre-wrap">
              {output || 'Click "Submit & Test" to run your code against the sample input.'}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
