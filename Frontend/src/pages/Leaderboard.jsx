import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosclient';
import Navbar from '../components/Navbar';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axiosClient.get('/user/leaderboard');
        setLeaderboard(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Split top 3 for special feature displays
  const topThree = leaderboard.slice(0, 3);
  const restUsers = leaderboard.slice(3);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black shadow-md border-2 border-amber-300 animate-pulse text-sm">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black shadow-md border-2 border-slate-200 text-sm">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black shadow-md border-2 border-amber-600 text-sm">
            🥉
          </div>
        );
      default:
        return <span className="text-base-content/60 font-semibold pl-2">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header section */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-sm text-base-content/60 max-w-md mx-auto">
            Rankings of top solvers and active daily coding streaks in our community. Solve more to reach the top!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error max-w-md mx-auto shadow-md">
            <span>{error}</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-300 p-8 shadow-sm">
            <p className="text-base-content/50">No users found on the leaderboard yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 Podiums */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 pb-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="order-2 md:order-1 bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm flex flex-col items-center justify-center text-center relative hover:-translate-y-1 transition-transform duration-300 md:h-[180px]">
                    <div className="absolute -top-5 bg-slate-300 text-slate-900 font-extrabold rounded-full px-3 py-1 text-xs border border-slate-200 shadow-sm flex items-center gap-1">
                      🥈 2nd Place
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center text-lg mb-2 mt-2 border border-slate-300">
                      {topThree[1].firstName?.charAt(0).toUpperCase()}
                    </div>
                    <NavLink
                      to={`/profile/${topThree[1]._id}`}
                      className="font-bold text-base-content hover:text-primary transition-colors line-clamp-1"
                    >
                      {topThree[1].firstName} {topThree[1].lastName || ''}
                    </NavLink>
                    <div className="text-xs text-base-content/60 mt-1">
                      <span className="font-semibold text-primary">{topThree[1].solvedCount} solved</span>
                      {topThree[1].currentStreak > 0 && (
                        <span className="ml-2 font-semibold text-warning">🔥 {topThree[1].currentStreak}d</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/5 to-base-100 rounded-2xl border-2 border-amber-400 p-6 shadow-md flex flex-col items-center justify-center text-center relative hover:-translate-y-1.5 transition-transform duration-300 md:h-[210px] scale-105">
                    <div className="absolute -top-5 bg-amber-400 text-amber-950 font-black rounded-full px-4 py-1 text-xs border border-amber-300 shadow-md flex items-center gap-1 animate-bounce">
                      👑 Champion
                    </div>
                    <div className="w-16 h-16 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-2xl mb-2 mt-2 border-2 border-amber-300 shadow-sm">
                      {topThree[0].firstName?.charAt(0).toUpperCase()}
                    </div>
                    <NavLink
                      to={`/profile/${topThree[0]._id}`}
                      className="font-extrabold text-base-content hover:text-primary transition-colors text-lg line-clamp-1"
                    >
                      {topThree[0].firstName} {topThree[0].lastName || ''}
                    </NavLink>
                    <div className="text-sm text-base-content/65 mt-1">
                      <span className="font-bold text-primary">{topThree[0].solvedCount} solved</span>
                      {topThree[0].currentStreak > 0 && (
                        <span className="ml-2.5 font-bold text-warning">🔥 {topThree[0].currentStreak}d</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="order-3 bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm flex flex-col items-center justify-center text-center relative hover:-translate-y-1 transition-transform duration-300 md:h-[180px]">
                    <div className="absolute -top-5 bg-amber-700 text-amber-100 font-semibold rounded-full px-3 py-1 text-xs border border-amber-600 shadow-sm flex items-center gap-1">
                      🥉 3rd Place
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-800/10 text-amber-700 font-black flex items-center justify-center text-lg mb-2 mt-2 border border-amber-800/20">
                      {topThree[2].firstName?.charAt(0).toUpperCase()}
                    </div>
                    <NavLink
                      to={`/profile/${topThree[2]._id}`}
                      className="font-bold text-base-content hover:text-primary transition-colors line-clamp-1"
                    >
                      {topThree[2].firstName} {topThree[2].lastName || ''}
                    </NavLink>
                    <div className="text-xs text-base-content/60 mt-1">
                      <span className="font-semibold text-primary">{topThree[2].solvedCount} solved</span>
                      {topThree[2].currentStreak > 0 && (
                        <span className="ml-2 font-semibold text-warning">🔥 {topThree[2].currentStreak}d</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List Table */}
            <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-300/50 border-b border-base-300 text-xs text-base-content/40 uppercase tracking-widest">
                      <th className="w-20 pl-6">Rank</th>
                      <th>User</th>
                      <th className="text-center w-36">Problems Solved</th>
                      <th className="text-center w-36">Active Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {leaderboard.map((u, index) => {
                      const rank = index + 1;
                      return (
                        <tr
                          key={u._id}
                          className="hover:bg-base-200/50 transition-colors duration-150 group"
                        >
                          <td className="pl-6 align-middle font-medium">
                            {getRankBadge(rank)}
                          </td>
                          <td className="align-middle">
                            <NavLink
                              to={`/profile/${u._id}`}
                              className="flex items-center gap-3 font-semibold text-base-content group-hover:text-primary transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                {u.firstName?.charAt(0).toUpperCase()}
                              </div>
                              <span className="line-clamp-1">
                                {u.firstName} {u.lastName || ''}
                              </span>
                            </NavLink>
                          </td>
                          <td className="text-center align-middle">
                            <span className="font-bold text-base-content/80 text-sm">
                              {u.solvedCount}
                            </span>
                          </td>
                          <td className="text-center align-middle">
                            {u.currentStreak > 0 ? (
                              <span
                                className="badge badge-warning text-warning-content font-bold px-3 py-2.5 rounded-full select-none"
                                title={`Max Streak: ${u.maxStreak || 0}`}
                              >
                                🔥 {u.currentStreak} Days
                              </span>
                            ) : (
                              <span className="text-base-content/30 text-xs font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
