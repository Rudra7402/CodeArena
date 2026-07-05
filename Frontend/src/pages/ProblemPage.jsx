import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate, NavLink } from 'react-router'; // added useNavigate, NavLink
import { useSelector } from 'react-redux';             // to check if user is logged in
import axiosClient from "../utils/axiosclient";
import SubmissionHistory from '../components/SubmissionHistory';
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';
import { RotateCcw, Sparkles, Hourglass, Database, Brain, CheckCircle2, Award, Maximize2, Minimize2 } from 'lucide-react';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const ProblemPage = () => {
  let { problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth); // used to gate Run/Submit for guests
  const { handleSubmit } = useForm();

  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [activeCaseTab, setActiveCaseTab] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [complexity, setComplexity] = useState(null);
  const [calculatingComplexity, setCalculatingComplexity] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isEditorFull, setIsEditorFull] = useState(false);
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const editorRef = useRef(null);

  // Load user notes from localStorage on mount/change
  useEffect(() => {
    if (problemId) {
      const savedNote = localStorage.getItem(`note_${user?._id || 'guest'}_${problemId}`);
      setNotes(savedNote || '');
      setComplexity(null);
      setRecommendations([]);
    }
  }, [problemId, user]);

  const handleNotesChange = (val) => {
    setNotes(val);
    localStorage.setItem(`note_${user?._id || 'guest'}_${problemId}`, val);
  };

  // Timer Tick handler
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {

        const response = await axiosClient.get(`/problem/problemById/${problemId}`);


        const initialCode = response.data.startCode.find(sc => 
          sc.language.toLowerCase() === selectedLanguage.toLowerCase() || 
          sc.language.toLowerCase() === (langMap[selectedLanguage] || '').toLowerCase()
        )?.initialCode || '';

        setProblem(response.data);

        setCode(initialCode);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes (with Auto-Save draft recovery)
  useEffect(() => {
    if (problem) {
      const draftKey = `draft_${user?._id || 'guest'}_${problemId}_${selectedLanguage}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft !== null) {
        setCode(savedDraft);
        setIsDraft(true);
      } else {
        const initialCode = problem.startCode.find(sc => 
          sc.language.toLowerCase() === selectedLanguage.toLowerCase() || 
          sc.language.toLowerCase() === (langMap[selectedLanguage] || '').toLowerCase()
        )?.initialCode || '';
        setCode(initialCode);
        setIsDraft(false);
      }
    }
  }, [selectedLanguage, problem, user, problemId]);

  const handleEditorChange = (value) => {
    const val = value || '';
    setCode(val);
    if (problem) {
      const draftKey = `draft_${user?._id || 'guest'}_${problemId}_${selectedLanguage}`;
      localStorage.setItem(draftKey, val);
      setIsDraft(true);
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define a custom theme to match our base-100 container color
    monaco.editor.defineTheme('leetcodeTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#262626', // Matches --color-base-100
      }
    });
    monaco.editor.setTheme('leetcodeTheme');
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleResetCode = () => {
    if (!problem) return;
    if (window.confirm("Are you sure you want to reset your code to the default template? Your current edits for this language will be lost.")) {
      const draftKey = `draft_${user?._id || 'guest'}_${problemId}_${selectedLanguage}`;
      localStorage.removeItem(draftKey);
      const initialCode = problem.startCode.find(sc => 
        sc.language.toLowerCase() === selectedLanguage.toLowerCase() || 
        sc.language.toLowerCase() === (langMap[selectedLanguage] || '').toLowerCase()
      )?.initialCode || '';
      setCode(initialCode);
      setIsDraft(false);
    }
  };

  const handleRun = async () => {
    // Gate: guests cannot run code, redirect them to login
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setRunResult(null);
    setActiveCaseTab(0);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage,
        customInput: useCustomInput ? customInput : undefined
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');

    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message || 'Internal server error')
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleCalculateComplexity = async () => {
    if (!problem) return;
    setCalculatingComplexity(true);
    try {
      const response = await axiosClient.post('/ai/complexity', {
        code,
        language: selectedLanguage,
        problemTitle: problem.title,
        problemDescription: problem.description
      });
      setComplexity(response.data);
    } catch (error) {
      console.error("Error calculating complexity:", error);
      alert("Failed to calculate complexity. Please try again.");
    } finally {
      setCalculatingComplexity(false);
    }
  };


  const handleSubmitCode = async () => {
    // Gate: guests cannot submit code, redirect them to login
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setSubmitResult(null);
    setComplexity(null);
    setRecommendations([]);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');

      if (response.data.accepted) {
        try {
          const recRes = await axiosClient.get(`/problem/recommend/${problemId}`);
          setRecommendations(recRes.data);
        } catch (recErr) {
          console.error("Error loading recommendations:", recErr);
        }
      }

    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult({
        accepted: false,
        error: typeof error.response?.data === 'string' ? error.response.data : (error.response?.data?.message || error.message || 'Internal server error'),
        passedTestCases: 0,
        totalTestCases: 0
      });
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-base-200 overflow-hidden">
      {/* Navigation bar at the top with border separator */}
      <div className="border-b border-base-300 flex-shrink-0">
        <Navbar />
      </div>

      {/* Main split workspace layout */}
      <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 bg-base-200 overflow-y-auto lg:overflow-hidden">
        {/* Left Panel */}
        <div className={`w-full lg:w-1/2 h-[500px] lg:h-auto flex flex-col bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm ${isEditorFull ? 'hidden' : ''}`}>
          {/* Left Tabs */}
          <div className="tabs tabs-bordered bg-base-200 px-4">
            <button
              className={`tab ${activeLeftTab === 'description' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('description')}
            >
              Description
            </button>
            <button
              className={`tab ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('editorial')}
            >
              Editorial
            </button>
            <button
              className={`tab ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`tab ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('submissions')}
            >
              Submissions
            </button>
            <button
              className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('chatAI')}
            >
              ChatAI
            </button>
            <button
              className={`tab ${activeLeftTab === 'notes' ? 'tab-active' : ''}`}
              onClick={() => setActiveLeftTab('notes')}
            >
              📝 Notes
            </button>
          </div>

          {/* Left Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {problem && (
              <>
                {activeLeftTab === 'description' && (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <h1 className="text-2xl font-bold">{problem.title}</h1>
                      <div className={`badge font-bold border rounded-lg select-none px-2.5 py-1 ${problem.difficulty.toLowerCase() === 'easy' ? 'bg-success/10 text-success border-success/20' :
                          problem.difficulty.toLowerCase() === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                            'bg-error/10 text-error border-error/20'
                        }`}>
                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(problem.tags) ? problem.tags.map((t, idx) => (
                          <div key={idx} className="badge font-bold bg-primary/10 text-primary border-primary/20 rounded-lg select-none px-2.5 py-1">
                            {t}
                          </div>
                        )) : (
                          <div className="badge font-bold bg-primary/10 text-primary border-primary/20 rounded-lg select-none px-2.5 py-1">
                            {problem.tags}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="prose max-w-none text-base-content text-sm leading-relaxed">
                       <ReactMarkdown>
                         {problem.description}
                       </ReactMarkdown>
                     </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                      <div className="space-y-4">
                        {problem.visibleTestCases.map((example, index) => (
                          <div key={index} className="bg-base-200 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                            <div className="space-y-2 text-sm font-mono">
                              <div><strong>Input:</strong> {example.input}</div>
                              <div><strong>Output:</strong> {example.output}</div>
                              <div><strong>Explanation:</strong> {example.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeLeftTab === 'editorial' && (
                  <div className="prose max-w-none">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold m-0">Editorial</h2>
                      {!(user?.isPremium || user?.role === 'admin') && (
                        <span className="badge badge-warning badge-sm font-extrabold animate-pulse">✨ PRO ONLY</span>
                      )}
                    </div>

                    {user?.isPremium || user?.role === 'admin' ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} tags={problem.tags} />
                      </div>
                    ) : (
                      <div className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-base-100 to-base-200 rounded-2xl p-8 text-center space-y-4 my-6 shadow-md not-prose select-none">
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                          🔒
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-base-content">Unlock Video & Written Editorials</h3>
                          <p className="text-xs text-base-content/60 mt-1 max-w-md mx-auto leading-relaxed">
                            Upgrade to CodeArena PRO to get instant access to instructor video walkthroughs and step-by-step logic explanations for all 150+ problems.
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/premium')}
                          className="btn btn-warning font-bold px-6 shadow-md hover:scale-105 transition-transform"
                        >
                          ✨ Upgrade to PRO (₹499)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'solutions' && (
                  <div>
                    <div className="flex items-center justify-between mb-4 select-none">
                      <h2 className="text-xl font-bold m-0">Solutions</h2>
                      {!(user?.isPremium || user?.role === 'admin') && (
                        <span className="badge badge-warning badge-sm font-extrabold animate-pulse">✨ PRO ONLY</span>
                      )}
                    </div>

                    {user?.isPremium || user?.role === 'admin' ? (
                      <div className="space-y-6">
                        {problem?.referenceSolution && problem.referenceSolution.length > 0 ? (
                          problem.referenceSolution.map((solution, index) => {
                            const isCopied = copiedIndex === index;
                            return (
                              <div key={index} className="border border-base-300 rounded-xl overflow-hidden shadow-sm bg-base-100">
                                {/* VSCode style header */}
                                <div className="bg-base-200/80 px-4 py-2 border-b border-base-300 flex items-center justify-between">
                                  <span className="text-xs font-bold text-base-content/70 select-none">
                                    {solution.language === 'C++' || solution.language?.toLowerCase() === 'cpp' ? 'C++ Solution' : (solution.language === 'JavaScript' || solution.language?.toLowerCase() === 'javascript' || solution.language?.toLowerCase() === 'js' ? 'JavaScript Solution' : 'Java Solution')}
                                  </span>

                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(solution.initialCode);
                                      setCopiedIndex(index);
                                      setTimeout(() => setCopiedIndex(null), 2000);
                                    }}
                                    className={`btn btn-xs rounded-lg font-bold select-none ${isCopied
                                        ? 'btn-success text-success-content'
                                        : 'btn-outline border-base-300 hover:bg-base-300 text-base-content/60'
                                      }`}
                                  >
                                    {isCopied ? '✓ Copied!' : 'Copy Code'}
                                  </button>
                                </div>

                                {/* Terminal Code Body */}
                                <div className="p-4 bg-[#0a0a0d]">
                                  <pre className="font-mono text-xs overflow-x-auto whitespace-pre text-base-content/90">
                                    <code>{solution.initialCode}</code>
                                  </pre>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-base-content/40 p-4 border border-dashed border-base-300 rounded-xl text-center bg-base-200/20 select-none">
                            Solutions will be available after you solve the problem.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-base-100 to-base-200 rounded-2xl p-8 text-center space-y-4 my-6 shadow-md select-none">
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                          🔒
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-base-content">Unlock Optimal Code Approaches</h3>
                          <p className="text-xs text-base-content/60 mt-1 max-w-md mx-auto leading-relaxed">
                            Get instant access to complete, verified reference solutions in C++, Java, and JavaScript with clean code explanations.
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/premium')}
                          className="btn btn-warning font-bold px-6 shadow-md hover:scale-105 transition-transform"
                        >
                          ✨ Upgrade to PRO (₹499)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'submissions' && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 select-none">My Submissions</h2>
                    {user ? (
                      <div className="text-gray-500">
                        <SubmissionHistory problemId={problemId} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-base-300 rounded-2xl text-center gap-4 bg-base-200/20 max-w-md mx-auto my-6 select-none">
                        <span className="text-3xl">🔒</span>
                        <div>
                          <h4 className="font-bold text-base text-base-content mb-1">Access Restrained</h4>
                          <p className="text-base-content/50 text-xs px-4">Please sign in to view your submission history.</p>
                        </div>
                        <NavLink to="/login" className="btn btn-primary btn-sm rounded-lg text-white font-bold px-5 mt-1 shadow-sm">Sign In</NavLink>
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'chatAI' && (
                  <div className="prose max-w-none">
                    <h2 className="text-xl font-bold mb-4 select-none">CHAT with AI</h2>
                    {user ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        <ChatAi problem={problem} userCode={code} selectedLanguage={selectedLanguage} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-base-300 rounded-2xl text-center gap-4 bg-base-200/20 max-w-md mx-auto my-6 select-none">
                        <span className="text-3xl">💬</span>
                        <div>
                          <h4 className="font-bold text-base text-base-content mb-1">AI Assistant Portal</h4>
                          <p className="text-base-content/50 text-xs px-4">Please sign in to chat with the AI assistant.</p>
                        </div>
                        <NavLink to="/login" className="btn btn-primary btn-sm rounded-lg text-white font-bold px-5 mt-1 shadow-sm">Sign In</NavLink>
                      </div>
                    )}
                  </div>
                )}

                {activeLeftTab === 'notes' && (
                  <div className="flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center mb-1 select-none">
                      <div>
                        <h2 className="text-xl font-bold text-base-content">My Code Notes</h2>
                        <p className="text-xs text-base-content/50 mt-1">Keep track of your thoughts, algorithms, and key insights for this problem.</p>
                      </div>
                      <span className="text-xs text-success/80 font-bold flex items-center gap-1.5 bg-success/5 border border-success/15 px-2.5 py-1 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Auto-Saved
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered font-mono text-xs w-full flex-1 min-h-[400px] resize-none focus:outline-none bg-base-200 border-base-300 p-4 text-base-content/95 leading-relaxed"
                      placeholder="Write your notes here..."
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                    />
                  </div>
                )}

              </>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`h-[600px] lg:h-auto flex flex-col bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm ${isEditorFull ? 'w-full' : 'w-full lg:w-1/2'}`}>
          {/* Right Tabs */}
          <div className="tabs tabs-bordered bg-base-200 px-4 flex justify-between items-center select-none">
            <div className="flex">
              <button
                className={`tab ${activeRightTab === 'code' ? 'tab-active' : ''}`}
                onClick={() => setActiveRightTab('code')}
              >
                Code
              </button>
              <button
                className={`tab ${activeRightTab === 'testcase' ? 'tab-active' : ''}`}
                onClick={() => setActiveRightTab('testcase')}
              >
                Testcase
              </button>
              <button
                className={`tab ${activeRightTab === 'result' ? 'tab-active' : ''}`}
                onClick={() => setActiveRightTab('result')}
              >
                Result
              </button>
            </div>
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsEditorFull(!isEditorFull)}
              className="btn btn-ghost btn-xs rounded-lg px-2 text-base-content/60 hover:text-base-content flex items-center gap-1 font-bold"
              title={isEditorFull ? "Exit Fullscreen" : "Fullscreen Editor"}
            >
              {isEditorFull ? (
                <>
                  <Minimize2 size={13} />
                  <span className="text-[10px]">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} />
                  <span className="text-[10px]">Full Screen</span>
                </>
              )}
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeRightTab === 'code' && (
              <div className="flex-1 flex flex-col">
                {/* Language Selector */}
                <div className="flex justify-between items-center p-4 border-b border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {['javascript', 'java', 'cpp'].map((lang) => (
                        <button
                          key={lang}
                          className={`btn btn-sm font-bold ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost text-base-content/65 hover:bg-base-200'}`}
                          onClick={() => handleLanguageChange(lang)}
                        >
                          {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                        </button>
                      ))}
                    </div>
                    {problem && (
                      <button
                        onClick={handleResetCode}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-1.5 font-bold text-xs"
                        title="Reset code to default starter template"
                      >
                        <RotateCcw size={13} />
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3.5">
                    {/* Interactive Timer */}
                    <div className="flex items-center gap-2 bg-base-300/60 hover:bg-base-300 px-3 py-1.5 rounded-xl border border-base-300 select-none text-xs font-mono font-black text-base-content/85">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                      <span>{formatTime(time)}</span>
                      <button
                        type="button"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className="btn btn-ghost btn-xs h-auto min-h-0 px-1 font-extrabold text-[10px] text-primary"
                      >
                        {timerRunning ? 'Pause' : 'Play'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTime(0)}
                        className="btn btn-ghost btn-xs h-auto min-h-0 px-1 font-extrabold text-[10px] text-error"
                      >
                        Reset
                      </button>
                    </div>

                    {isDraft && (
                      <span className="text-xs text-success/80 font-bold flex items-center gap-1.5 select-none bg-success/5 border border-success/15 px-2.5 py-1 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Draft Auto-Saved
                      </span>
                    )}
                  </div>
                </div>

                {!user && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-500 font-semibold select-none">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>You are not signed in. Please sign in to run or submit code.</span>
                    </div>
                    <NavLink to="/login" className="btn btn-warning btn-xs text-warning-content font-bold rounded-lg px-2.5">
                      Sign In
                    </NavLink>
                  </div>
                )}

                {/* Monaco Editor */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="leetcodeTheme"
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'line',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      mouseWheelZoom: true,
                    }}
                  />
                </div>
              </div>
            )}

            {activeRightTab === 'testcase' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 select-none">
                  <h3 className="font-extrabold text-base text-base-content">Test Results</h3>
                  <div className="flex gap-2 bg-base-200/50 p-0.5 rounded-xl border border-base-300">
                    <button
                      className={`btn btn-xs rounded-lg px-3 font-bold border-none transition-all ${!useCustomInput ? 'btn-neutral text-base-content shadow-sm' : 'btn-ghost text-base-content/40 hover:text-base-content'}`}
                      onClick={() => {
                        setUseCustomInput(false);
                        setRunResult(null);
                        setActiveCaseTab(0);
                      }}
                    >
                      Test Cases
                    </button>
                    <button
                      className={`btn btn-xs rounded-lg px-3 font-bold border-none transition-all ${useCustomInput ? 'btn-neutral text-base-content shadow-sm' : 'btn-ghost text-base-content/40 hover:text-base-content'}`}
                      onClick={() => {
                        setUseCustomInput(true);
                        setRunResult(null);
                        setActiveCaseTab(0);
                      }}
                    >
                      Custom Testcase
                    </button>
                  </div>
                </div>

                {useCustomInput && !runResult ? (
                  <div className="flex-1 flex flex-col min-h-0 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">
                      Input Custom Testcase:
                    </label>
                    <textarea
                      className="textarea textarea-bordered font-mono text-xs w-full flex-1 min-h-[180px] resize-none focus:outline-none bg-base-200 border-base-300/80 p-3 rounded-xl text-base-content/95"
                      placeholder="Type custom input parameters (e.g. 5\n1 2 3)"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                    />
                    <p className="text-[10px] font-bold text-base-content/30 mt-2 select-none">
                      💡 Click "Run" to compile and execute your code using this custom input.
                    </p>
                  </div>
                ) : runResult ? (
                  runResult.testCases ? (
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                      {/* Case Tabs Row */}
                      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-base-300 items-center justify-between">
                        <div className="flex gap-2">
                          {runResult.testCases.map((tc, index) => {
                            const isPassed = runResult.success || tc.status_id === 3;
                            return (
                              <button
                                key={index}
                                className={`btn btn-xs rounded-lg font-bold flex items-center gap-1.5 transition-all select-none ${activeCaseTab === index
                                  ? 'btn-neutral text-base-content border-base-300 shadow-sm'
                                  : 'btn-ghost text-base-content/40 hover:text-base-content'
                                  }`}
                                onClick={() => setActiveCaseTab(index)}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isPassed ? 'bg-success' : 'bg-error animate-pulse'}`}></span>
                                {useCustomInput ? 'Custom Case' : `Case ${index + 1}`}
                              </button>
                            );
                          })}
                        </div>
                        {useCustomInput && (
                          <button
                            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 font-bold transition-all"
                            onClick={() => setRunResult(null)}
                          >
                            Edit Input
                          </button>
                        )}
                      </div>

                      {/* Active Case Details Panel */}
                      {(() => {
                        const activeCase = runResult.testCases[activeCaseTab] || runResult.testCases[0];
                        if (!activeCase) return null;
                        const isPassed = runResult.success || activeCase.status_id === 3;
                        return (
                          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                            {/* Case Status Header Banner */}
                            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${isPassed
                              ? 'bg-success/10 border-success/15 text-success'
                              : 'bg-error/10 border-error/15 text-error'
                              }`}>
                              <div className="flex items-center gap-1.5">
                                {isPassed ? '✓ Execution Successful' : `✗ ${activeCase.status?.description || 'Execution Failed'}`}
                              </div>
                              <div className="flex gap-4 text-[10px] text-base-content/50">
                                <span>Runtime: {runResult.runtime || '0.00'}s</span>
                                <span>Memory: {runResult.memory || '0'} KB</span>
                              </div>
                            </div>

                            {/* Input details */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">Input:</label>
                              <pre className="bg-base-200 border border-base-300/80 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap text-base-content/95 max-h-[150px] overflow-y-auto">
                                {activeCase.stdin}
                              </pre>
                            </div>

                            {/* Output details */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">
                                {activeCase.compile_output ? 'Compilation Error:' : activeCase.stderr ? 'Runtime Error:' : 'Your Output:'}
                              </label>
                              <pre className={`p-3 rounded-xl border font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-[260px] overflow-y-auto ${isPassed
                                ? 'bg-base-200 border-base-300/80 text-base-content/95'
                                : 'bg-error/5 border-error/15 text-error font-semibold'
                                }`}>
                                {activeCase.stdout || activeCase.compile_output || activeCase.stderr || '(No Output printed)'}
                              </pre>
                            </div>

                            {/* Expected Details - only render if not using custom input */}
                            {!useCustomInput && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">Expected Output:</label>
                                <pre className="bg-base-200 border border-base-300/80 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap text-base-content/95 max-h-[150px] overflow-y-auto">
                                  {activeCase.expected_output}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="alert alert-error shadow-md rounded-2xl border border-error/20 my-4 text-xs font-semibold text-error-content flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>{runResult.error || 'Internal server error while running code'}</span>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    {/* Mock Case Tabs before Run is clicked */}
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-base-300">
                      {(problem?.visibleTestCases || []).map((_, index) => (
                        <button
                          key={index}
                          className={`btn btn-xs rounded-lg font-bold transition-all select-none ${activeCaseTab === index
                            ? 'btn-neutral text-base-content border-base-300 shadow-sm'
                            : 'btn-ghost text-base-content/40 hover:text-base-content'
                            }`}
                          onClick={() => setActiveCaseTab(index)}
                        >
                          Case {index + 1}
                        </button>
                      ))}
                    </div>

                    {/* Pre-run Example Details Preview */}
                    {(() => {
                      const activeExample = (problem?.visibleTestCases || [])[activeCaseTab] || (problem?.visibleTestCases || [])[0];
                      if (!activeExample) return <p className="text-base-content/40 text-sm">No test cases configured.</p>;
                      return (
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                          {/* Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">Input:</label>
                            <pre className="bg-base-200 border border-base-300/80 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap text-base-content/95">
                              {activeExample.input}
                            </pre>
                          </div>

                          {/* Expected Output */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">Expected Output:</label>
                            <pre className="bg-base-200 border border-base-300/80 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap text-base-content/95">
                              {activeExample.output}
                            </pre>
                          </div>

                          {/* Explanation */}
                          {activeExample.explanation && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-base-content/45 select-none">Explanation:</label>
                              <div className="text-xs text-base-content/60 leading-relaxed bg-base-200/40 border border-base-300/50 p-3 rounded-xl whitespace-pre-wrap">
                                {activeExample.explanation}
                              </div>
                            </div>
                          )}

                          <p className="text-[10px] font-bold text-base-content/30 mt-4 select-none">
                            💡 Click "Run" to execute your solution against this input case.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {activeRightTab === 'result' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0">
                <h3 className="font-extrabold text-base text-base-content mb-4 select-none">Submission Result</h3>

                {submitResult ? (
                  <div className="space-y-5">
                    {/* Status header card */}
                    {submitResult.accepted ? (
                      <div className="flex flex-col items-center justify-center py-4 select-none">
                        <div className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center shadow-inner mb-2 animate-bounce">
                          <CheckCircle2 className="w-12 h-12 text-success" />
                        </div>
                        <div className="text-2xl font-black text-success tracking-tight">Accepted</div>
                        <p className="text-xs text-base-content/40 mt-1">All test cases passed successfully!</p>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border bg-error/10 border-error/15 text-error">
                        <h4 className="font-black text-2xl tracking-tight select-none">
                          ❌ {submitResult.status || 'Submission Failed'}
                        </h4>
                        <p className="text-xs font-bold text-base-content/50 mt-1 select-none">
                          Completed evaluation for the submission code.
                        </p>
                      </div>
                    )}

                    {!submitResult.accepted && submitResult.error && (
                      <div className="bg-error/5 border border-error/20 p-4 rounded-xl space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-error select-none">
                          {submitResult.status === 'Compilation Error' ? 'Compiler Output:' : 'Error Details:'}
                        </label>
                        <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap text-error/90 break-words max-h-[260px] overflow-y-auto">
                          {submitResult.error}
                        </pre>
                      </div>
                    )}

                    {/* AI Complexity Analysis */}
                    {submitResult.accepted && !complexity && (
                      <div className="flex justify-center mt-2 mb-4">
                        <button
                          onClick={handleCalculateComplexity}
                          disabled={calculatingComplexity}
                          className="btn btn-warning btn-md gap-2 w-full max-w-sm font-bold shadow-md hover:scale-105 transition-transform"
                        >
                          {calculatingComplexity ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          )}
                          {calculatingComplexity ? 'Analyzing Complexity...' : 'Calculate Complexity (AI)'}
                        </button>
                      </div>
                    )}

                    {submitResult.accepted && complexity && (
                      <div className="space-y-4 my-2 text-left">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Time Complexity Card */}
                          <div className="bg-gradient-to-br from-base-200 to-base-300 p-4 border border-base-300 rounded-xl flex items-center gap-3.5 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              <Hourglass className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-base-content/40 uppercase select-none">Time Complexity</div>
                              <div className="text-lg font-black text-primary leading-tight font-mono">{complexity.timeComplexity}</div>
                            </div>
                          </div>
                          {/* Space Complexity Card */}
                          <div className="bg-gradient-to-br from-base-200 to-base-300 p-4 border border-base-300 rounded-xl flex items-center gap-3.5 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                              <Database className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-base-content/40 uppercase select-none">Space Complexity</div>
                              <div className="text-lg font-black text-secondary leading-tight font-mono">{complexity.spaceComplexity}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Complexity Explanation */}
                        {complexity.explanation && (
                          <div className="bg-base-200/50 border border-base-300/80 p-4 rounded-xl space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-base-content/40 select-none flex items-center gap-1.5">
                              <Brain className="w-3.5 h-3.5 text-primary" /> Complexity Explanation
                            </label>
                            <p className="text-xs text-base-content/85 leading-relaxed font-medium">
                              {complexity.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metrics grid details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-base-200 p-3 border border-base-300 rounded-xl text-center shadow-sm">
                        <div className="text-sm font-black text-base-content">
                          {submitResult.passedTestCases} / {submitResult.totalTestCases}
                        </div>
                        <div className="text-[9px] font-bold text-base-content/40 uppercase mt-0.5 select-none">Passed Cases</div>
                      </div>
                      <div className="bg-base-200 p-3 border border-base-300 rounded-xl text-center shadow-sm">
                        <div className="text-sm font-black text-base-content">
                          {submitResult.runtime || '0.00'}s
                        </div>
                        <div className="text-[9px] font-bold text-base-content/40 uppercase mt-0.5 select-none">Runtime</div>
                      </div>
                      <div className="bg-base-200 p-3 border border-base-300 rounded-xl text-center shadow-sm">
                        <div className="text-sm font-black text-base-content">
                          {submitResult.memory ? `${submitResult.memory} KB` : 'N/A'}
                        </div>
                        <div className="text-[9px] font-bold text-base-content/40 uppercase mt-0.5 select-none">Memory</div>
                      </div>
                    </div>



                    {/* Recommended Next Problems */}
                    {submitResult.accepted && recommendations.length > 0 && (
                      <div className="space-y-3 mt-6 text-left border-t border-base-300 pt-5">
                        <h4 className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Recommended Next Problems</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {recommendations.map((rec) => (
                            <NavLink
                              key={rec._id}
                              to={`/problems/${rec._id}`}
                              className="bg-base-200 hover:bg-base-300/80 border border-base-300 p-4 rounded-xl shadow-sm transition-all flex flex-col gap-1.5 select-none hover:-translate-y-0.5"
                            >
                              <div className="font-bold text-sm text-base-content line-clamp-1">{rec.title}</div>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  rec.difficulty.toLowerCase() === 'easy' ? 'bg-success/15 text-success' :
                                  rec.difficulty.toLowerCase() === 'medium' ? 'bg-warning/15 text-warning' :
                                  'bg-error/15 text-error'
                                }`}>
                                  {rec.difficulty}
                                </span>
                                {rec.tags && rec.tags.length > 0 && (
                                  <span className="text-[9px] text-base-content/50 line-clamp-1 max-w-[120px]">
                                    {Array.isArray(rec.tags) ? rec.tags.join(', ') : rec.tags}
                                  </span>
                                )}
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-base-content/45 text-sm p-4 border border-dashed border-base-300 rounded-xl text-center bg-base-200/20 select-none">
                    Click "Submit" to execute evaluation against all test cases.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-base-300 flex justify-end bg-base-100">
            <div className="flex gap-2">
              <button
                className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`}
                onClick={handleRun}
                disabled={loading}
              >
                Run
              </button>
              <button
                className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
                onClick={handleSubmitCode}
                disabled={loading}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;