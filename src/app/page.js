'use client';

import { useState } from 'react';

import Editor from '@monaco-editor/react';

// ============================================================
// Coding problems — preserved from the original starter
// ============================================================
const PROBLEMS = [
  {
    id: 'two-sum',
    title: '1. Two Sum',
    difficulty: 'Easy',
    description:
      'Write a program that reads two numbers from input and prints their sum.',
    sampleInput: '5 7',
    expectedOutput: '12',
    starters: {
      javascript: '// Read input or print directly\nconsole.log(5 + 7);',
      python: '# Read input or print directly\nprint(5 + 7)',
      cpp: '#include  // Replace with your solution',
      java: 'public class Main {\n  public static void main(String[] args) {\n    // Replace with your solution\n  }\n}',
    },
  },
  {
    id: 'reverse-string',
    title: '2. Reverse a String',
    difficulty: 'Easy',
    description:
      'Print the string "hello" in reverse order ("olleh").',
    sampleInput: 'hello',
    expectedOutput: 'olleh',
    starters: {
      javascript: 'console.log("hello".split("").reverse().join(""));',
      python: 'print("hello"[::-1])',
      cpp: '#include  // Replace with your solution',
      java: 'public class Main {\n  public static void main(String[] args) {\n    // Replace with your solution\n  }\n}',
    },
  },
];

// Languages supported by the API
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',    label: 'Python' },
  { value: 'cpp',       label: 'C++' },
  { value: 'java',      label: 'Java' },
];

/**
 * Extract the result message for display.
 */
function extractResult(data) {
  if (!data) return { message: 'No response received.', isError: true };

  if (data.error) {
    return { message: data.error, isError: true };
  }

  const statusId = data.status?.id;
  const statusDesc = data.status?.description ?? '';

  let message = '';
  if (data.compile_output) message += '[Compile]\n' + data.compile_output + '\n';
  if (data.stdout)        message += '[Output]\n' + data.stdout + '\n';
  if (data.stderr)        message += '[Stderr]\n' + data.stderr + '\n';

  if (!message) message = statusDesc || 'Execution complete.';

  return {
    message,
    isError: statusId >= 6,
    status: statusDesc,
  };
}

export default function Home() {
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(PROBLEMS[0].starters.javascript);
  const [output, setOutput] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProblemChange = (problem) => {
    setSelectedProblem(problem);
    setCode(problem.starters[language] || '');
    setOutput('');
    setTestResult(null);
  };

  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
    setCode(selectedProblem.starters[selected] || '');
  };

  const handleRunCode = async () => {
    setLoading(true);
    setOutput('Running test cases on Judge0 engine...');
    setTestResult(null);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
      });
      if (!response.ok) {
        let errorText = 'Server error: ' + response.status;
        try {
          const errData = await response.json();
          errorText = errData.error || errorText;
        } catch { /* ignore */ }
        setOutput(errorText);
        setTestResult('FAILED');
        setLoading(false);
        return;
      }
      const data = await response.json();
      const result = extractResult(data);
      setOutput(result.message);
      setTestResult(
        !result.isError && data.stdout
          ? data.stdout.trim() === selectedProblem.expectedOutput.trim()
            ? 'PASSED'
            : 'FAILED'
          : 'FAILED'
      );
    } catch (err) {
      setOutput('Failed to reach backend server.');
      setTestResult('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    &lt;main className="min-h-screen bg-slate-900 text-white p-6"&gt;
      &lt;header className="border-b border-slate-700 pb-4 mb-6"&gt;
        &lt;h1 className="text-2xl font-bold text-blue-400"&gt;
          Automated Coding &amp; Assessment Dashboard
        &lt;/h1&gt;
        &lt;p className="text-sm text-slate-400"&gt;
          Select a problem, write your solution, and evaluate against test cases.
        &lt;/p&gt;
      &lt;/header&gt;
      &lt;div className="grid grid-cols-1 lg:grid-cols-12 gap-6"&gt;
        {/* Left Sidebar: Problem Description */}
        &lt;div className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4"&gt;
          &lt;div&gt;
            &lt;label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2"&gt;
              Select Problem
            &lt;/label&gt;
            &lt;div className="space-y-2"&gt;
              {PROBLEMS.map((prob) =&gt; (
                &lt;button
                  key={prob.id}
                  onClick={() =&gt; handleProblemChange(prob)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedProblem.id === prob.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                &gt;
                  {prob.title}
                &lt;/button&gt;
              ))}
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;hr className="border-slate-700" /&gt;
          &lt;div&gt;
            &lt;div className="flex items-center justify-between mb-2"&gt;
              &lt;h2 className="text-lg font-bold text-white"&gt;
                {selectedProblem.title}
              &lt;/h2&gt;
              &lt;span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded font-semibold"&gt;
                {selectedProblem.difficulty}
              &lt;/span&gt;
            &lt;/div&gt;
            &lt;p className="text-sm text-slate-300 mb-4"&gt;
              {selectedProblem.description}
            &lt;/p&gt;
            &lt;div className="bg-slate-900 p-3 rounded text-xs space-y-2 border border-slate-700"&gt;
              &lt;div&gt;
                &lt;span className="text-slate-400 font-bold block"&gt;Sample Input:&lt;/span&gt;
                &lt;code className="text-blue-300"&gt;{selectedProblem.sampleInput}&lt;/code&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;span className="text-slate-400 font-bold block"&gt;Expected Output:&lt;/span&gt;
                &lt;code className="text-green-300"&gt;{selectedProblem.expectedOutput}&lt;/code&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Right Area: Code Editor & Execution Console */}
        &lt;div className="lg:col-span-8 space-y-4"&gt;
          &lt;div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700"&gt;
            &lt;div className="flex items-center gap-3"&gt;
              &lt;label className="text-sm font-medium"&gt;Language:&lt;/label&gt;
              &lt;select
                value={language}
                onChange={handleLanguageChange}
                className="bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              &gt;
                {LANGUAGES.map((lang) =&gt; (
                  &lt;option key={lang.value} value={lang.value}&gt;{lang.label}&lt;/option&gt;
                ))}
              &lt;/select&gt;
            &lt;/div&gt;
            &lt;button
              onClick={handleRunCode}
              disabled={loading}
              className={`font-semibold px-5 py-1.5 rounded text-sm transition-colors ${
                loading
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white`}
            &gt;
              {loading ? 'Evaluating...' : 'Submit & Test'}
            &lt;/button&gt;
          &lt;/div&gt;

          &lt;div className="border border-slate-700 rounded-lg overflow-hidden"&gt;
            &lt;Editor
              height="340px"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) =&gt; setCode(val || '')}
            /&gt;
          &lt;/div&gt;

          {/* Output & Evaluation Console */}
          &lt;div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-2"&gt;
            &lt;div className="flex items-center justify-between"&gt;
              &lt;h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider"&gt;
                Execution Console
              &lt;/h3&gt;
              {testResult === 'PASSED' &amp;&amp; (
                &lt;span className="bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded"&gt;
                  {'\u2713'} PASSED
                &lt;/span&gt;
              )}
              {testResult === 'FAILED' &amp;&amp; (
                &lt;span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded"&gt;
                  {'\u2715'} WRONG ANSWER
                &lt;/span&gt;
              )}
            &lt;/div&gt;
            &lt;pre className="bg-slate-950 p-3 rounded text-green-400 text-sm font-mono overflow-x-auto min-h-[70px]"&gt;
              {output || 'Click "Submit & Test" to run your code against test cases.'}
            &lt;/pre&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/main&gt;
  );
                  }
