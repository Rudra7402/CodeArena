import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosclient';
import { logoutUser } from '../authslice';
import Navbar from '../components/Navbar';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all'
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Easily change this to 10 or 20 for production scale

  // Automatically reset to page 1 whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  useEffect(() => {
    const loadProblemsData = async () => {
      setLoading(true);
      try {
        const promises = [axiosClient.get('/problem/getAllProblems')];
        if (user) {
          promises.push(axiosClient.get('/problem/problemsSolvedByUser'));
        }
        const results = await Promise.all(promises);
        setProblems(results[0].data);
        if (user && results[1]) {
          setSolvedProblems(results[1].data);
        }
      } catch (error) {
        console.error('Error loading problems page data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProblemsData();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]); // Clear solved problems on logout
  };

  const filteredProblems = problems.filter(problem => {
    const titleMatch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty.includes(filters.difficulty);
    const tagMatch = filters.tag === 'all' || 
      (Array.isArray(problem.tags)
        ? problem.tags.some(t => t.toLowerCase() === filters.tag.toLowerCase())
        : (problem.tags || '').toLowerCase().includes(filters.tag.toLowerCase()));

    const isSolved = solvedProblems.some(sp => sp._id === problem._id);
    const statusMatch = filters.status === 'all' ||
      (filters.status === 'solved' && isSolved) ||
      (filters.status === 'unsolved' && !isSolved);

    return titleMatch && difficultyMatch && tagMatch && statusMatch;
  });

  // Suggest the first unsolved problem as the Daily Challenge
  const dailyProblem = problems.find(p => !solvedProblems.some(sp => sp._id === p._id)) || problems[0];

  // Calculate Paginated List parameters
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);

  // Current page ka last index kya hoga.
  const indexOfLastProblem = currentPage * itemsPerPage;


  const indexOfFirstProblem = indexOfLastProblem - itemsPerPage;


  const paginatedProblems = filteredProblems.slice(indexOfFirstProblem, indexOfLastProblem);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT COLUMN: Search, Filters & Problems Table (8 Cols) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Search and Filters Row */}
            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Large Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search problems by title..."
                    className="input input-bordered w-full pl-11 h-12 bg-base-200/40 border-base-300 rounded-xl focus:border-primary focus:outline-none text-sm transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>

                {/* Filter Select Boxes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    className="select select-bordered bg-base-200/40 border-base-300 rounded-xl text-xs font-bold h-12 min-h-0 w-36"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="all">Status: All</option>
                    <option value="solved">Solved</option>
                    <option value="unsolved">Unsolved</option>
                  </select>

                  <select
                    className="select select-bordered bg-base-200/40 border-base-300 rounded-xl text-xs font-bold h-12 min-h-0 w-36"
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  >
                    <option value="all">Difficulty: All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  {/* Clear Active Filters */}
                  {(filters.status !== 'all' || filters.difficulty !== 'all' || filters.tag !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setFilters({ difficulty: 'all', tag: 'all', status: 'all' });
                        setSearchQuery('');
                      }}
                      className="btn btn-ghost h-12 min-h-0 text-error hover:bg-error/10 font-bold gap-1 rounded-xl px-3"
                      title="Reset Filters"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Problems List Table */}
            <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-base-200/50 border-b border-base-300 text-xs text-base-content/40 uppercase tracking-widest font-black">
                        <th className="w-14 text-center pl-6">#</th>
                        <th className="w-16 text-center">Status</th>
                        <th>Title</th>
                        <th className="w-36 text-center">Tag</th>
                        <th className="w-28 text-center pr-6">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {[...Array(6)].map((_, index) => (
                        <tr key={index} className="animate-pulse">
                          <td className="w-14 text-center pl-6 py-4 align-middle">
                            <div className="h-4 bg-base-300 rounded w-6 mx-auto"></div>
                          </td>
                          <td className="w-16 text-center align-middle">
                            <div className="h-5 w-5 bg-base-300 rounded-full mx-auto"></div>
                          </td>
                          <td className="py-4 align-middle">
                            <div className="h-4 bg-base-300 rounded w-3/4"></div>
                          </td>
                          <td className="w-36 text-center align-middle">
                            <div className="h-4 bg-base-300 rounded w-16 mx-auto"></div>
                          </td>
                          <td className="w-28 text-center pr-6 align-middle">
                            <div className="h-6 bg-base-300 rounded-lg w-20 mx-auto"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="text-base-content/20 text-6xl mb-4">🔍</div>
                  <h3 className="font-extrabold text-xl text-base-content/80">No problems match your filters</h3>
                  <p className="text-sm text-base-content/40 mt-1">Try clearing your search query or dropdown settings.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="bg-base-200/50 border-b border-base-300 text-xs text-base-content/40 uppercase tracking-widest font-black">
                        <th className="w-14 text-center pl-6">#</th>
                        <th className="w-16 text-center">Status</th>
                        <th>Title</th>
                        <th className="w-36 text-center">Tag</th>
                        <th className="w-28 text-center pr-6">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {paginatedProblems.map((problem, index) => {
                        const isSolved = solvedProblems.some((sp) => sp._id === problem._id);
                        const problemIndex = (currentPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr
                            key={problem._id}
                            className="hover:bg-base-200/40 transition-colors duration-100 group"
                          >
                            {/* Number */}
                            <td className="text-center align-middle pl-6">
                              <span className="text-xs font-bold text-base-content/30">{problemIndex}</span>
                            </td>

                            {/* Status Icon */}
                            <td className="text-center align-middle">
                              {isSolved ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-base-content/15"></span>
                              )}
                            </td>

                            {/* Problem Title Link */}
                            <td className="align-middle py-4">
                              <NavLink
                                to={`/problem/${problem._id}`}
                                className="font-extrabold text-sm text-base-content/90 hover:text-primary transition-colors"
                              >
                                {problem.title}
                              </NavLink>
                            </td>

                            {/* Tag */}
                            <td className="text-center align-middle">
                              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[220px] mx-auto">
                                {(Array.isArray(problem.tags) ? problem.tags : (problem.tags ? [problem.tags] : ['General'])).map((tag, idx) => (
                                  <span key={idx} className="text-[9px] font-black text-info/90 bg-info/10 border border-info/10 px-2 py-1 rounded-md uppercase tracking-wider select-none whitespace-nowrap">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Difficulty styled label */}
                            <td className="text-center align-middle pr-6">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg select-none ${getDifficultyStyles(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 py-4 bg-base-100 border-t border-base-200">
                  <button
                    className="btn btn-sm btn-outline border-base-300 rounded-xl px-3 font-bold"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`btn btn-sm w-9 rounded-xl font-bold ${currentPage === page
                        ? 'btn-primary text-primary-content'
                        : 'btn-outline border-base-300 hover:bg-base-200 text-base-content/85'
                        }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="btn btn-sm btn-outline border-base-300 rounded-xl px-3 font-bold"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Bottom total status row */}
              {filteredProblems.length > 0 && (
                <div className="px-6 py-4 bg-base-200/30 border-t border-base-300 text-xs text-base-content/40 font-bold">
                  Showing {paginatedProblems.length} of {filteredProblems.length} matching problems (Total: {problems.length})
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Stats & Suggestions Sidebar (4 Cols) ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Welcome User Widget */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm relative overflow-hidden">
              {/* Subtle absolute background gradient pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>

              <h2 className="text-lg font-black text-base-content flex items-center gap-2">
                {user ? `Welcome back, ${user.firstName || 'User'}! 👋` : 'Welcome to CodeArena! 👋'}
              </h2>
              <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
                {user
                  ? 'Ready to level up your programming skills today? Solve problems, build up your daily streak, and compete on the leaderboard.'
                  : 'Sign in to save your coding progress, track daily streaks, and view editorial solution code.'
                }
              </p>

              {user ? (
                <div className="mt-5 flex items-center gap-3">
                  <NavLink
                    to="/profile"
                    className="btn btn-primary btn-sm rounded-xl font-bold px-4"
                  >
                    View Settings
                  </NavLink>

                  {user.currentStreak > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 text-amber-600 rounded-xl text-xs font-black select-none"
                      title="Daily Streak"
                    >
                      🔥 {user.currentStreak} Days
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-3">
                  <NavLink
                    to="/login"
                    className="btn btn-primary btn-sm rounded-xl font-bold px-4"
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="btn btn-outline btn-sm rounded-xl font-bold px-4"
                  >
                    Create Account
                  </NavLink>
                </div>
              )}
            </div>

            {/* Daily Challenge Card */}
            {dailyProblem && (
              <div className="bg-gradient-to-br from-base-100 to-base-200/50 p-6 rounded-2xl border border-base-300 shadow-sm relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-warning/5 rounded-full blur-xl pointer-events-none transition-transform duration-300 group-hover:scale-125"></div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-warning uppercase bg-warning/15 border border-warning/10 px-2.5 py-1 rounded-md tracking-wider select-none">
                    ⭐ Recommended Solve
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-base-content leading-snug group-hover:text-primary transition-colors">
                  {dailyProblem.title}
                </h3>

                <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-5">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md select-none ${getDifficultyStyles(dailyProblem.difficulty)}`}>
                    {dailyProblem.difficulty}
                  </span>
                  {(Array.isArray(dailyProblem.tags) ? dailyProblem.tags : (dailyProblem.tags ? [dailyProblem.tags] : ['General'])).map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-black text-info bg-info/10 px-2 py-0.5 rounded-md uppercase tracking-wider select-none whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                </div>

                <NavLink
                  to={`/problem/${dailyProblem._id}`}
                  className="btn btn-outline btn-primary btn-sm w-full rounded-xl font-bold group-hover:bg-primary group-hover:text-primary-content transition-all"
                >
                  Solve Challenge →
                </NavLink>
              </div>
            )}

            {/* Quick Tags Explorer */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm">
              <h3 className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-4 select-none">
                Popular Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Arrays', value: 'Array' },
                  { label: 'Strings', value: 'String' },
                  { label: 'Linked Lists', value: 'LinkedList' },
                  { label: 'Trees', value: 'Tree' },
                  { label: 'Graphs', value: 'Graph' },
                  { label: 'DP', value: 'DP' },
                  { label: 'Stack / Queue', value: 'Stack' },
                  { label: 'Two Pointers', value: 'Two Pointers' }
                ].map(tag => {
                  const isActive = filters.tag.toLowerCase() === tag.value.toLowerCase();
                  return (
                    <button
                      key={tag.value}
                      onClick={() => setFilters({ ...filters, tag: isActive ? 'all' : tag.value })}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border select-none ${isActive
                        ? 'bg-primary border-primary text-primary-content shadow-sm scale-95'
                        : 'bg-base-200/50 border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                        }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const getDifficultyStyles = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-success/15 border-success/20 text-success';
    case 'medium':
      return 'bg-warning/15 border-warning/20 text-warning';
    case 'hard':
      return 'bg-error/15 border-error/20 text-error';
    default:
      return 'bg-neutral/15 border-neutral/20 text-neutral';
  }
};

export default Homepage;