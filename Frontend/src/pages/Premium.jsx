import { Check, Sparkles, Video, Code, MessageSquare, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosclient';

function Premium() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) {
      // Redirect to login if guest tries to buy
      navigate('/login');
      return;
    }
    try {
      // Ask backend to generate Stripe Checkout URL
      const res = await axiosClient.post('/payment/create-checkout-session');
      if (res.data.url) {
        // Redirect user's browser to Stripe payment screen
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  // If user is already premium or admin, show their VIP membership status!
  if (user?.isPremium || user?.role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 flex flex-col items-center justify-center text-center gap-8">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold bg-amber-500/20 border-2 border-amber-500/50 text-amber-500 shadow-md animate-bounce">
            <Sparkles className="w-4 h-4" /> ACTIVE PRO MEMBERSHIP
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-base-content tracking-tight">
              You are a <span className="text-amber-500">CodeArena PRO</span> Member!
            </h1>
            <p className="text-base-content/70 text-lg max-w-xl mx-auto">
              Thank you for supporting CodeArena. You have lifetime access to all gated interview preparation tools and creator solutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4 text-left">
            <div className="bg-base-100 p-6 rounded-2xl border border-amber-500/30 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base-content">
                <Check className="w-5 h-5 text-success" />
                <span>Unlimited Editor Solutions</span>
              </div>
              <p className="text-xs text-base-content/60 pl-7">View optimal clean code approaches for all 150+ DSA problems without restrictions.</p>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl border border-amber-500/30 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base-content">
                <Check className="w-5 h-5 text-success" />
                <span>Creator Video Walkthroughs</span>
              </div>
              <p className="text-xs text-base-content/60 pl-7">Watch high-res step-by-step logic explanations from admin instructors.</p>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl border border-amber-500/30 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base-content">
                <Check className="w-5 h-5 text-success" />
                <span>Unlimited AI Assistant Hints</span>
              </div>
              <p className="text-xs text-base-content/60 pl-7">No daily rate-limits or caps on AI debugging and hint requests.</p>
            </div>

            <div className="bg-base-100 p-6 rounded-2xl border border-amber-500/30 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-base-content">
                <Check className="w-5 h-5 text-success" />
                <span>Verified DSA Master Badge</span>
              </div>
              <p className="text-xs text-base-content/60 pl-7">Your profile stands out on global rankings and shareable resume links.</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => navigate('/problems')}
              className="btn btn-primary px-8 h-12 text-base font-bold shadow-lg"
            >
              Start Solving PRO Problems
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">
      
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col gap-16">
        
        {/* ── HERO SECTION ── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mt-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse">
            <Sparkles className="w-3 h.3" /> Up to 3x interview prep speed
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-base-content leading-tight tracking-tight">
            Supercharge Your <span className="text-primary">DSA Prep.</span>
          </h1>
          <p className="text-base-content/75 text-base md:text-lg">
            Unlock step-by-step video solutions, optimal editor approaches, and unlimited AI assistant access to clear your placement tests.
          </p>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full items-stretch">
          
          {/* Card 1: Free Tier */}
          <div className="bg-base-100 rounded-2xl border border-base-300 p-8 flex flex-col justify-between shadow-sm relative">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-base-content">Standard Tier</h3>
                <p className="text-xs text-base-content/50 mt-1">Great for starting out</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-base-content">₹0</span>
                <span className="text-sm text-base-content/60">/ forever</span>
              </div>
              
              <div className="divider my-0"></div>

              {/* List of features */}
              <ul className="space-y-3.5 text-sm">
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Access to 150+ DSA coding tasks</span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Free multi-language Compiler</span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80 text-base-content/40 line-through">
                  <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                  <span>Optimal Written Editor Solutions</span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80 text-base-content/40 line-through">
                  <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                  <span>Ad-free Admin Video Solutions</span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80 text-base-content/40 line-through">
                  <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                  <span>Unlimited AI chat code hints</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button disabled className="btn btn-outline btn-disabled w-full h-11 min-h-0 font-semibold">
                Current Plan
              </button>
            </div>
          </div>

          {/* Card 2: Premium Tier */}
          <div className="bg-base-100 rounded-2xl border-2 border-amber-500/80 p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              Best Value
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xl font-bold text-base-content">Lifetime Pro</h3>
                  <span className="badge badge-warning badge-sm">✨ Gated Content</span>
                </div>
                <p className="text-xs text-base-content/50 mt-1">One-time payment. Lifetime access.</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-base-content">₹499</span>
                <span className="text-xs line-through text-base-content/40">₹999</span>
                <span className="badge badge-success badge-sm font-semibold">50% OFF</span>
              </div>
              
              <div className="divider my-0"></div>

              {/* List of premium features */}
              <ul className="space-y-3.5 text-sm">
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Access to all 150+ coding tasks</span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="flex items-center gap-1">
                    <Code className="w-4 h-4 text-amber-500" />
                    <strong>Optimal Editor Solutions</strong> (All languages)
                  </span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4 text-amber-500" />
                    <strong>Video Explanations</strong> (Creator walk-throughs)
                  </span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    <strong>Unlimited AI hints</strong> (No rate-limits)
                  </span>
                </li>
                <li className="flex items-center gap-2.5 text-base-content/80">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>Resume tag: "Verified DSA Master" profile badge</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleUpgrade}
                className="btn btn-warning w-full h-11 min-h-0 text-warning-content font-bold shadow-md hover:scale-[1.01] transition-transform duration-200"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>

        </div>

        {/* ── DETAIL COMPARISON TABLE ── */}
        <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm max-w-4xl mx-auto w-full mb-8">
          <div className="p-6 bg-base-300 border-b border-base-300">
            <h3 className="font-bold text-lg text-base-content">Plan Feature Comparison</h3>
            <p className="text-xs text-base-content/60">Compare standard access against professional preparation tools.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead>
                <tr className="border-b border-base-200">
                  <th>Feature</th>
                  <th className="text-center">Free Plan</th>
                  <th className="text-center text-amber-500 font-bold">Premium Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-base-200 hover:bg-base-200/30">
                  <td>Daily Practice Limits</td>
                  <td className="text-center text-base-content/70">Unlimited submissions</td>
                  <td className="text-center font-semibold text-success">Unlimited submissions</td>
                </tr>
                <tr className="border-b border-base-200 hover:bg-base-200/30">
                  <td>Standard Code Compiler</td>
                  <td className="text-center text-base-content/70">Javascript, C++, Java</td>
                  <td className="text-center font-semibold text-success">Javascript, C++, Java</td>
                </tr>
                <tr className="border-b border-base-200 hover:bg-base-200/30">
                  <td>Optimal Code & Complexity (Written)</td>
                  <td className="text-center text-error">❌ Locked</td>
                  <td className="text-center font-bold text-success">✅ Unlimited Access</td>
                </tr>
                <tr className="border-b border-base-200 hover:bg-base-200/30">
                  <td>High-Res Video Solutions (Admin)</td>
                  <td className="text-center text-error">❌ Locked</td>
                  <td className="text-center font-bold text-success">✅ Unlimited Access</td>
                </tr>
                <tr className="border-b border-base-200 hover:bg-base-200/30">
                  <td>AI Hints & Detailed Doubts helper</td>
                  <td className="text-center text-base-content/60">5 hints per day</td>
                  <td className="text-center font-bold text-success">✅ Unlimited Access</td>
                </tr>
                <tr className="hover:bg-base-200/30">
                  <td>Support Channel</td>
                  <td className="text-center text-base-content/60">Community boards</td>
                  <td className="text-center font-bold text-success">✅ Dedicated Slack/Discord</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Premium;
