import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axiosclient";
import { Send, Bot, User, Trash2, Loader2, Sparkles, Copy, Check, Lock } from "lucide-react";

// Markdown and Inline Style Parser Utility
function renderInlineStyles(text) {
  // Bold formatting: **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-base-content">{part.slice(2, -2)}</strong>;
    }
    // Inline code formatting: `code`
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((subPart, subIdx) => {
      if (subPart.startsWith('`') && subPart.endsWith('`')) {
        return <code key={subIdx} className="bg-base-300 text-secondary font-mono text-[11px] px-1.5 py-0.5 rounded font-bold">{subPart.slice(1, -1)}</code>;
      }
      return subPart;
    });
  });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="btn btn-ghost btn-xs text-[10px] text-neutral-content/80 hover:bg-neutral-focus/40 rounded px-2 gap-1"
    >
      {copied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function parseMarkdown(text) {
  if (!text) return null;
  // Regex to split code blocks from regular text
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // If it is a code block
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : 'code';
      const codeContent = match ? match[2].trim() : part.slice(3, -3).trim();

      return (
        <div key={index} className="my-4 rounded-2xl overflow-hidden border border-base-300 shadow-md bg-neutral text-neutral-content font-mono text-xs max-w-full">
          <div className="flex justify-between items-center bg-neutral-focus/60 px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-neutral-content/60 border-b border-neutral-focus/30 select-none">
            <span>{language || 'code'}</span>
            <CopyButton text={codeContent} />
          </div>
          <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed select-all">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    }

    // Process line-by-line format for inline tags like lists, bold, and headers
    const lines = part.split('\n');
    return (
      <div key={index} className="space-y-1.5">
        {lines.map((line, lineIdx) => {
          let content = line;

          // Headers: ### Header
          if (content.startsWith('### ')) {
            return <h4 key={lineIdx} className="text-sm font-extrabold mt-4 mb-1.5 text-base-content/90">{content.slice(4)}</h4>;
          }
          if (content.startsWith('## ')) {
            return <h3 key={lineIdx} className="text-base font-black mt-5 mb-2 text-base-content">{content.slice(3)}</h3>;
          }
          if (content.startsWith('# ')) {
            return <h2 key={lineIdx} className="text-lg font-black mt-6 mb-2.5 text-base-content">{content.slice(2)}</h2>;
          }

          // Lists: * Item or - Item
          if (content.trim().startsWith('* ') || content.trim().startsWith('- ')) {
            const listText = content.trim().slice(2);
            return (
              <ul key={lineIdx} className="list-disc pl-5 my-1 text-xs text-base-content/90">
                <li>{renderInlineStyles(listText)}</li>
              </ul>
            );
          }

          // Horizontal lines: ---
          if (content.trim() === '---') {
            return <hr key={lineIdx} className="my-4 border-base-300" />;
          }

          return <p key={lineIdx} className="leading-relaxed min-h-[1em] text-xs text-base-content/90">{renderInlineStyles(content)}</p>;
        })}
      </div>
    );
  });
}

function ChatAi({ problem, userCode, selectedLanguage }) {
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(`chat_history_${problem._id}`);
        return saved ? JSON.parse(saved) : [
            {
                role: "assistant",
                content: "Hi! Ask me anything about this DSA problem. I can provide optimal solutions, walk through logical intuition, explain complexities, or give hints!"
            }
        ];
    });
    const [loading, setLoading] = useState(false);

    // Retrieve user profile to check subscription status
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const isPremium = user?.isPremium || user?.role === 'admin';

    // Synchronize query count with user's persistent backend count
    const initialDbCount = user?.aiQueries?.[problem._id] || 0;
    const [queriesUsed, setQueriesUsed] = useState(initialDbCount);
    const isLimitReached = !isPremium && queriesUsed >= 5;

    useEffect(() => {
        localStorage.setItem(`chat_history_${problem._id}`, JSON.stringify(messages));
    }, [messages, problem._id]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: { message: "" }
    });

    const messageText = watch("message");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    const onSubmit = async (data) => {
        const trimmedMessage = data.message.trim();
        if (!trimmedMessage) return;

        const userMessage = {
            role: "user",
            content: trimmedMessage
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        reset();
        setLoading(true);

        try {
            const response = await axiosClient.post(
                "/ai/chat",
                {
                    messages: updatedMessages.slice(-6),
                    title: problem.title,
                    description: problem.description,
                    testCases: problem.visibleTestCases,
                    startCode: problem.startCode,
                    userCode,
                    selectedLanguage,
                    problemId: problem._id
                },
                {
                    timeout: 120000
                }
            );

            // Successfully received response, increment query count locally
            setQueriesUsed(prev => prev + 1);

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: response.data.message
                }
            ]);

        } catch (error) {
            console.error(error);
            if (error.response?.status === 403) {
                setQueriesUsed(5);
                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "You've reached your free AI query limit of 5 messages for this problem. Upgrade to Premium for unlimited tutoring!"
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Error: Failed to generate response. Please check your Gemini API key and connection."
                    }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[650px] bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-lg animate-fadeIn">
            {/* Header banner */}
            <div className="bg-base-200/80 backdrop-blur px-5 py-3 border-b border-base-300 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary/10 rounded-xl text-primary">
                        <Bot size={20} />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-base-content flex items-center gap-1.5 flex-wrap">
                            AI Co-Pilot Helper
                            <span className="badge badge-xs badge-primary badge-outline font-extrabold uppercase tracking-wide px-1.5">Gemini 2.5</span>
                            {isPremium ? (
                                <span className="badge badge-xs bg-amber-500/15 border-amber-500/30 text-amber-500 font-extrabold uppercase tracking-wide px-1.5 flex items-center gap-0.5">
                                    <Sparkles size={8} className="fill-amber-500" /> PRO
                                </span>
                            ) : (
                                <span className={`badge badge-xs font-extrabold px-1.5 ${
                                    queriesUsed >= 4 
                                        ? 'bg-error/20 border-error/30 text-error' 
                                        : 'bg-base-300 text-base-content/70 border-base-300'
                                }`}>
                                    FREE: {queriesUsed}/5
                                </span>
                            )}
                        </span>
                        <p className="text-[10px] text-base-content/50">Context-aware DSA tutor</p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        const defaultMsg = [
                            {
                                role: "assistant",
                                content: "Hi! Ask me anything about this DSA problem. I can provide optimal solutions, walk through logical intuition, explain complexities, or give hints!"
                            }
                        ];
                        setMessages(defaultMsg);
                        localStorage.removeItem(`chat_history_${problem._id}`);
                    }}
                    type="button"
                    className="btn btn-xs btn-outline btn-error rounded-xl gap-1"
                >
                    <Trash2 size={12} />
                    Clear Chat
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-base-100 to-base-200/30">
                {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    return (
                        <div
                            key={index}
                            className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                        >
                            {!isUser && (
                                <div className="p-2 bg-neutral text-neutral-content rounded-xl shadow-sm flex-shrink-0">
                                    <Bot size={16} />
                                </div>
                            )}

                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${isUser
                                ? 'bg-primary text-primary-content rounded-tr-none font-medium'
                                : 'bg-base-200 text-base-content/95 border border-base-300 rounded-tl-none'
                                }`}>
                                {isUser ? (
                                    <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {parseMarkdown(msg.content)}
                                    </div>
                                )}
                            </div>

                            {isUser && (
                                <div className="p-2 bg-primary/10 text-primary rounded-xl flex-shrink-0">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3 items-start justify-start animate-pulse">
                        <div className="p-2 bg-neutral text-neutral-content rounded-xl flex-shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-base-200 border border-base-300 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-base-content/60">
                            <Loader2 size={14} className="animate-spin text-primary" />
                            <span>Thinking & writing solution...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form with Multi-line Textarea */}
            {isLimitReached ? (
                <div className="p-5 bg-base-100 border-t border-base-300 shadow-inner flex flex-col items-center text-center gap-3 animate-fadeIn">
                    <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20">
                        <Lock size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xs font-extrabold text-base-content flex items-center justify-center gap-1.5 select-none">
                            Free Trial Limit Reached
                            <span className="badge badge-xs bg-amber-500/15 border-amber-500/30 text-amber-500 font-black">5/5 USED</span>
                        </h4>
                        <p className="text-[10px] text-base-content/50 mt-1 max-w-sm select-none">
                            You've used all 5 free AI Co-Pilot messages for this problem. Upgrade to Premium for unlimited AI tutoring, step-by-step solutions, and badging!
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/premium')}
                        className="btn btn-primary btn-sm rounded-xl text-white font-extrabold px-6 shadow-md hover:shadow-primary/30 gap-1.5 flex items-center"
                    >
                        <Sparkles size={12} className="fill-white" />
                        Upgrade to Premium
                    </button>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="p-4 bg-base-100 border-t border-base-300 shadow-inner"
                >
                    <div className="flex items-end gap-3 bg-base-200 p-2 rounded-2xl border border-base-300 focus-within:border-primary transition-all">
                        <textarea
                            placeholder="Type your question here (Press Enter to send, Shift+Enter for new line)..."
                            rows={1}
                            className="textarea textarea-ghost flex-1 text-xs focus:outline-none resize-none leading-relaxed min-h-[36px] max-h-32 py-2 px-3 align-bottom bg-transparent"
                            {...register("message", {
                                required: true,
                                minLength: 2
                            })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(onSubmit)();
                                }
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading || !messageText?.trim()}
                            className="btn btn-primary rounded-xl text-white font-bold h-9 w-9 min-h-0 p-0 flex items-center justify-center shadow-md hover:shadow-primary/30 disabled:opacity-40"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default ChatAi;