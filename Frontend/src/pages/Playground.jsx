import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axiosClient from '../utils/axiosclient';
import { Play } from 'lucide-react';
import Navbar from '../components/Navbar';

// Language display names for UI
const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
};

// Default starter code for each language
const DEFAULT_CODE = {
  javascript: `// Write your code here\nconsole.log("Hello, World!");`,
  java: `// Write your code here\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
  cpp: `// Write your code here\n#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}`,
};

// Monaco editor language map
const MONACO_LANG = {
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
};

function Playground() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE['javascript']);
  const [stdin, setStdin] = useState('');          // user-provided input
  const [output, setOutput] = useState(null);       // run result
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);


  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setOutput(null);
  };

  // Run code by calling the playground backend endpoint
  const handleRun = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const response = await axiosClient.post('/submission/playground', {
        code,
        language,
        stdin, // optional: user's custom input
      });
      setOutput(response.data);
    } catch (err) {
      setOutput({ stderr: 'Something went wrong. Please try again.', stdout: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">

      {/* ── NAVBAR: shared component ────────────────────────────────────── */}
      <Navbar />
      {/* ── END NAVBAR ───────────────────────────────────────────── */}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">

        {/* ── LEFT: Editor Panel ───── */}
        <div className="flex flex-col flex-1 gap-3">

          {/* Language Selector + Run Button bar */}
          <div className="flex items-center justify-between bg-base-100 rounded-xl px-4 py-3 border border-base-300 shadow-sm">
            <div className="flex gap-2">
              {Object.keys(LANGUAGE_LABELS).map((lang) => (
                <button
                  key={lang}
                  className={`btn btn-sm ${language === lang ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleLanguageChange(lang)}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
            {/* Run button */}
            <button
              className={`btn btn-success btn-sm gap-2 ${loading ? 'loading' : ''}`}
              onClick={handleRun}
              disabled={loading}
            >
              {!loading && <Play className="w-4 h-4" />}
              {loading ? 'Running...' : 'Run Code'}
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 rounded-xl overflow-hidden border border-base-300" style={{ minHeight: '400px' }}>
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
              }}
            />
          </div>
        </div>

        {/* ── RIGHT: Input + Output Panel ───── */}
        <div className="flex flex-col w-96 gap-3">

          {/* Stdin box */}
          <div className="bg-base-100 rounded-xl border border-base-300 p-3 flex flex-col gap-2 shadow-sm">
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
              Custom Input (stdin)
            </label>
            <textarea
              className="textarea textarea-bordered font-mono text-sm w-full h-28 resize-none"
              placeholder="Enter your input here..."
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
            />
          </div>

          {/* Output box */}
          <div className="flex-1 bg-base-100 rounded-xl border border-base-300 p-3 flex flex-col gap-2 shadow-sm">
            <label className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
              Output
            </label>

            {/* Placeholder before first run */}
            {!output && !loading && (
              <div className="flex-1 flex items-center justify-center text-base-content/40 text-sm">
                Click "Run Code" to see output here
              </div>
            )}

            {/* Loading spinner */}
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}

            {/* Output result */}
            {output && !loading && (
              <div className="flex flex-col gap-3">

                {/* Status badge — check all error types */}
                <div className="flex items-center gap-2">
                  <span
                    className={`badge badge-sm ${output.compile_output || output.stderr
                      ? 'badge-error'
                      : 'badge-success'
                      }`}
                  >
                    {output.status || 'Unknown'}
                  </span>
                  {/* Only show runtime if execution actually happened (no compile error) */}
                  {output.runtime > 0 && (
                    <span className="text-xs text-base-content/60">
                      {output.runtime}s · {output.memory} KB
                    </span>
                  )}
                </div>

                {/* stdout — normal output */}
                {output.stdout && (
                  <div>
                    <p className="text-xs font-semibold text-success mb-1">stdout</p>
                    <pre className="bg-base-300 rounded p-3 text-sm font-mono whitespace-pre-wrap break-words">
                      {output.stdout}
                    </pre>
                  </div>
                )}

                {/* compile_output — shown when there is a compilation error (e.g. missing import) */}
                {output.compile_output && (
                  <div>
                    <p className="text-xs font-semibold text-error mb-1">Compilation Error</p>
                    <pre className="bg-base-300 rounded p-3 text-sm font-mono whitespace-pre-wrap break-words text-error">
                      {output.compile_output}
                    </pre>
                  </div>
                )}

                {/* stderr — runtime errors (null pointer, divide by zero, etc.) */}
                {output.stderr && (
                  <div>
                    <p className="text-xs font-semibold text-error mb-1">Runtime Error</p>
                    <pre className="bg-base-300 rounded p-3 text-sm font-mono whitespace-pre-wrap break-words text-error">
                      {output.stderr}
                    </pre>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
      {/* ── END MAIN CONTENT ───────────────────────────────────────────── */}

    </div>
  );
}

export default Playground;
