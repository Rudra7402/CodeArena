import { NavLink } from 'react-router';
import { Code2, Video, Bot } from 'lucide-react';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────────────────────
// LandingPage – shown to unauthenticated users
// Now uses DaisyUI semantic classes for automatic light/dark mode
// ─────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">

      {/* ── NAVBAR: shared component, consistent with all other pages ────── */}
      <Navbar />
      {/* ── END NAVBAR ─────────────────────────────────────────────────── */}


      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-6 py-20 flex flex-col md:flex-row items-center gap-14">

        {/* Left: Text Content */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 w-fit text-xs font-medium bg-primary/10 border border-primary/30 text-primary">
            AI-Powered Coding Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold text-base-content leading-tight">
            Practice. Debug. <br />
            <span className="text-primary">Master Code.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg leading-relaxed text-base-content/70">
            Solve real coding problems, watch expert video walkthroughs, and get
            guided hints from an AI assistant — without giving away the answer.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <NavLink
              to="/signup"
              className="btn btn-primary btn-md text-primary-content"
            >
              Start Coding Free
            </NavLink>
            <NavLink
              to="/problems"
              className="btn btn-outline btn-md"
            >
              Browse Problems
            </NavLink>
          </div>

        </div>

        {/* Right: Fake Code Editor */}
        <div className="flex-1 w-full max-w-md">
          <div className="rounded-xl overflow-hidden shadow-2xl bg-base-200 border border-base-300">

            {/* Editor Title Bar */}
            <div className="px-4 py-3 flex items-center gap-2 bg-base-300 border-b border-base-300">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-xs ml-2 text-base-content/60">two_sum.py</span>
            </div>

            {/* Syntax-highlighted code snippet */}
            <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed text-base-content">
              <code>
                <span className="text-purple-400">def </span>
                <span className="text-yellow-500">twoSum</span>
                <span>(nums, target):{'\n'}</span>
                <span>    seen = </span>
                <span className="text-primary">{'{}\n'}</span>
                <span className="text-purple-400">    for </span>
                <span>i, num </span>
                <span className="text-purple-400">in </span>
                <span className="text-yellow-500">enumerate</span>
                <span>(nums):{'\n'}</span>
                <span>        diff = target - num{'\n'}</span>
                <span className="text-purple-400">        if </span>
                <span>diff </span>
                <span className="text-purple-400">in </span>
                <span>seen:{'\n'}</span>
                <span className="text-purple-400">            return </span>
                <span>[seen[diff], i]{'\n'}</span>
                <span>        seen[num] = i</span>
              </code>
            </pre>

            {/* Status bar: test result */}
            <div className="px-5 py-3 flex items-center gap-2 border-t border-base-300 bg-base-200">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-xs text-success">
                All test cases passed · Runtime: 52ms
              </span>
            </div>

          </div>
        </div>

      </section>
      {/* ── END HERO ───────────────────────────────────────────────────── */}


      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section className="py-8 bg-base-100 border-y border-base-300 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 text-center">

          <div>
            <p className="text-3xl font-bold text-primary">150+</p>
            <p className="text-sm mt-1 text-base-content/70">Coding Problems</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-primary">3</p>
            <p className="text-sm mt-1 text-base-content/70">Difficulty Levels</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-primary">AI</p>
            <p className="text-sm mt-1 text-base-content/70">Coding Assistant</p>
          </div>

          <div>
            <p className="text-3xl font-bold text-primary">Free</p>
            <p className="text-sm mt-1 text-base-content/70">To Get Started</p>
          </div>

        </div>
      </section>
      {/* ── END STATS BAR ──────────────────────────────────────────────── */}


      {/* ── FEATURES SECTION ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-base-200 transition-colors duration-300">

        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-base-content text-center mb-12">
            Everything you need to level up
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Problems */}
            <div className="rounded-xl p-6 transition-colors duration-200 bg-base-100 border border-base-300 hover:border-primary/50 shadow-sm">
              <Code2 className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-base-content font-semibold text-lg mb-2">Coding Problems</h3>
              <p className="text-sm leading-relaxed text-base-content/70">
                Solve Easy, Medium, and Hard problems across Arrays, Linked Lists,
                Graphs, and Dynamic Programming.
              </p>
            </div>

            {/* Card 2: Videos */}
            <div className="rounded-xl p-6 transition-colors duration-200 bg-base-100 border border-base-300 hover:border-primary/50 shadow-sm">
              <Video className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-base-content font-semibold text-lg mb-2">Video Solutions</h3>
              <p className="text-sm leading-relaxed text-base-content/70">
                Watch step-by-step video walkthroughs authored by admins to
                understand the right approach for each problem.
              </p>
            </div>

            {/* Card 3: AI */}
            <div className="rounded-xl p-6 transition-colors duration-200 bg-base-100 border border-base-300 hover:border-primary/50 shadow-sm">
              <Bot className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-base-content font-semibold text-lg mb-2">AI Assistant</h3>
              <p className="text-sm leading-relaxed text-base-content/70">
                Get guided hints and explanations from our AI — it helps you think
                through the problem without giving away the answer.
              </p>
            </div>

          </div>
        </div>

      </section>
      {/* ── END FEATURES ───────────────────────────────────────────────── */}


      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-6 text-center bg-base-100 border-t border-base-300 transition-colors duration-300">
        <p className="text-sm text-base-content/60">
          © 2026 CodeArena. All rights reserved.
        </p>
      </footer>
      {/* ── END FOOTER ─────────────────────────────────────────────────── */}

    </div>
  );
}

export default LandingPage;
