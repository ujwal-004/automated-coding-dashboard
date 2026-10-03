'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

// Sample coding problems
const PROBLEMS = [
  {
    id: 'two-sum',
    title: '1. Two Sum',
    difficulty: 'Easy',
    description: 'Write a program that reads two numbers from input and prints their sum.',
    sampleInput: '5 7',
    expectedOutput: '12',
    starters: {
      javascript: '// Read input or print directly\nconsole.log(5 + 7);',
      python: '# Read input or print directly\nprint(5 + 7)',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << 5 + 7;\n    return 0;\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(5 + 7);\n    }\n}'
    }
  },
  {
    id: 'reverse-string',
    title: '2. Reverse a String',
    difficulty: 'Easy',
    description: 'Print the string "hello" in reverse order ("olleh").',
    sampleInput: 'hello',
    expectedOutput: 'olleh',
    starters: {
      javascript: 'console.log("hello".split("").reverse().join(""));',
      python: 'print("hello"[::-1])',
      cpp: '#include <iostream>\n#include <string>\n#include <algorithm>\n\nint main() {\n    std::string s = "hello";\n    std::reverse(s.begin(), s.end());\n    std::cout << s;\n    return 0;\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(new StringBuilder("hello").reverse().toString());\n    }\n}'
    }
  }
];

export default function Home() {
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(PROBLEMS[0].starters.javascript);
  const [output, setOutput] = useState('');
  const [testResult, setTestResult] = useState(null); // 'PASSED', 'FAILED', or null
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

      const data = await response.json();

      let actualOutput = '';
      if (data.stdout !== undefined || data.stderr !== undefined || data.compile_output !== undefined) {
        actualOutput = (data.stdout || data.compile_output || data.stderr || '').trim();
      } else if (data.status && data.status.description) {
        actualOutput = `Status: ${data.status.description}`;
      } else {
        actualOutput = 'Error executing code.';
      }

      setOutput(actualOutput);

      // Automated Test Case Evaluation
      if (actualOutput === selectedProblem.expectedOutput.trim()) {
        setTestResult('PASSED');
      } else {
        setTestResult('FAILED');
      }
    } catch (err) {
      setOutput('Failed to reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <header className="border-b border-slate-700 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-400">Automated Coding & Assessment Dashboard</h1>
        <p className="text-sm text-slate-400">Select a problem, write your solution, and evaluate against test cases.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Problem Description */}
        <div className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Problem</label>
            <div className="space-y-2">
              {PROBLEMS.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => handleProblemChange(prob)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedProblem.id === prob.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {prob.title}
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
                <span className="text-slate-400 font-bold block">Sample Input:</span>
                <code className="text-blue-300">{selectedProblem.sampleInput}</code>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Expected Output:</span>
                <code className="text-green-300">{selectedProblem.expectedOutput}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Code Editor & Execution Console */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Language:</label>
              <select 
                value={language}
                onChange={handleLanguageChange}
                className="bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <button
              onClick={handleRunCode}
              disabled={loading}
              className={`${
                loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              } text-white font-semibold px-5 py-1.5 rounded text-sm transition-colors`}
            >
              {loading ? 'Evaluating...' : 'Submit & Test'}
            </button>
          </div>

          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <Editor
              height="340px"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => setCode(val || '')}
            />
          </div>

          {/* Output & Evaluation Console */}
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Execution Console</h3>
              {testResult === 'PASSED' && (
                <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                  ✓ PASSED
                </span>
              )}
              {testResult === 'FAILED' && (
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">
                  ✕ WRONG ANSWER
                </span>
              )}
            </div>
            <pre className="bg-slate-950 p-3 rounded text-green-400 text-sm font-mono overflow-x-auto min-h-[70px]">
              {output || 'Click "Submit & Test" to run your code against test cases.'}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}