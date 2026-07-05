import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Code2 } from 'lucide-react';
import { logoutUser } from '../authslice';
import ThemeToggle from './ThemeToggle';

// ─────────────────────────────────────────────────────────────
// Shared Navbar — used across LandingPage, Problems, Playground
// Automatically adapts based on auth state:
//   - Guest   → Shows Sign In + Sign Up buttons
//   - Logged in → Shows username dropdown with Logout / Admin link
// ─────────────────────────────────────────────────────────────

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 z-10 transition-colors duration-300">

      {/* ── Left: Logo + Nav Links ── */}
      <div className="flex-1 flex items-center gap-1">
        <NavLink to="/" className="btn btn-ghost text-lg font-bold flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          CodeArena
        </NavLink>

        {/* Nav links — visible to all users */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
          <NavLink
            to="/problems"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm text-sm ${isActive ? 'text-primary font-semibold' : 'text-base-content/70'}`
            }
          >
            Problems
          </NavLink>
          <NavLink
            to="/playground"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm text-sm ${isActive ? 'text-primary font-semibold' : 'text-base-content/70'}`
            }
          >
            Compiler
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm text-sm ${isActive ? 'text-primary font-semibold' : 'text-base-content/70'}`
            }
          >
            Leaderboard
          </NavLink>
          <NavLink
            to="/premium"
            className={({ isActive }) =>
              `btn btn-ghost btn-sm text-sm text-amber-500 hover:text-amber-600 gap-1 font-semibold ${isActive ? 'text-amber-600 font-bold' : ''}`
            }
          >
            ✨ Premium
          </NavLink>
        </div>
      </div>

      {/* ── Right: Theme Toggle + Auth ── */}
      <div className="flex-none flex items-center gap-2">
        <ThemeToggle />

        {user ? (
          /* Logged-in: Show streak and username dropdown with logout */
          <div className="flex items-center gap-2">

            {/* Streak Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-extrabold text-xs select-none shadow-sm"
              title="Daily Streak"
            >
              <span>🔥</span>
              <span>{user.currentStreak || 0}</span>
            </div>

            {/* PRO Badge */}
            {(user.isPremium || user.role === 'admin') && (
              <div
                className="hidden md:flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm animate-pulse"
                title="CodeArena PRO Member"
              >
                ✨ PRO
              </div>
            )}

            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2">
                {/* Avatar circle with first letter */}
                <div className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                  {user.firstName?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm">{user.firstName}</span>
              </div>
              <ul tabIndex={0} className="mt-3 p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-box w-44 border border-base-300 z-50">
                {/* Admin link — only shown for admin users */}
                {user.role === 'admin' && (
                  <li>
                    <NavLink to="/admin" className="text-sm">Admin Panel</NavLink>
                  </li>
                )}
                <li>
                  <NavLink to="/profile" className="text-sm">Profile Settings</NavLink>
                </li>
                <li>
                  <button onClick={handleLogout} className="text-sm text-error">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Guest: Show Sign In + Sign Up */
          <div className="flex items-center gap-2">
            <NavLink to="/login" className="btn btn-ghost btn-sm text-sm hidden sm:inline-flex">
              Sign In
            </NavLink>
            <NavLink to="/signup" className="btn btn-primary btn-sm text-sm text-primary-content">
              Sign Up
            </NavLink>
          </div>
        )}
      </div>

    </nav>
  );
}

export default Navbar;
