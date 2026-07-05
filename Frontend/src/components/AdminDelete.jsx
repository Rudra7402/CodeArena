import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosclient';
import { NavLink } from 'react-router';
import { ArrowLeft, Search, Trash2, AlertCircle, Filter, Tag, AlertTriangle } from 'lucide-react';

const AdminDelete = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [problemToDelete, setProblemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblems');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!problemToDelete) return;
    try {
      setIsDeleting(true);
      await axiosClient.delete(`/problem/delete/${problemToDelete._id}`);
      setProblems(problems.filter(problem => problem._id !== problemToDelete._id));
      setProblemToDelete(null);
    } catch (err) {
      setError('Failed to delete problem');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProblems = problems.filter(prob => {
    const matchesSearch = prob.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || prob.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pb-16">
      {/* Top Navbar */}
      <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 px-6 mb-8">
        <div className="flex-1">
          <NavLink to="/admin" className="btn btn-ghost gap-2 font-normal">
            <ArrowLeft size={18} />
            <span>Back to Admin Dashboard</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error font-semibold px-3 py-3">
            🗑️ Delete Manager
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {error && (
          <div className="alert alert-error shadow-lg mb-6 rounded-2xl border border-error/20">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-base-content">Delete Problems</h1>
            <p className="text-base-content/60">Permanently remove challenges and their associated user submission histories.</p>
          </div>

          {/* Filter Pill */}
          <div className="flex items-center gap-2 bg-base-100 p-1.5 rounded-2xl border border-base-300 shadow-sm">
            <Filter size={16} className="text-base-content/60 ml-2" />
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`btn btn-xs rounded-xl ${difficultyFilter === diff ? 'btn-neutral' : 'btn-ghost'}`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40" size={20} />
          <input
            type="text"
            placeholder="Search problems by title to delete..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl bg-base-100 shadow-sm focus:border-error"
          />
        </div>

        {/* Problem Table Card */}
        <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th className="w-1/12 py-4 pl-6">#</th>
                  <th className="w-5/12 py-4">Title</th>
                  <th className="w-2/12 py-4">Difficulty</th>
                  <th className="w-2/12 py-4">Tags</th>
                  <th className="w-2/12 py-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-base-content/50">
                      No matching problems found.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem, index) => (
                    <tr key={problem._id} className="hover:bg-base-200/40 transition-colors">
                      <th className="pl-6 text-base-content/50">{index + 1}</th>
                      <td className="font-bold text-base-content">{problem.title}</td>
                      <td>
                        <span className={`badge font-semibold ${
                          problem.difficulty === 'Easy' 
                            ? 'badge-success badge-outline' 
                            : problem.difficulty === 'Medium' 
                              ? 'badge-warning badge-outline' 
                              : 'badge-error badge-outline'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          {(Array.isArray(problem.tags) ? problem.tags : (problem.tags ? [problem.tags] : ['General'])).map((tag, idx) => (
                            <span key={idx} className="badge badge-ghost gap-1 text-xs whitespace-nowrap">
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right pr-6">
                        <button 
                          onClick={() => setProblemToDelete(problem)}
                          className="btn btn-sm btn-error gap-1.5 font-bold rounded-xl shadow-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {problemToDelete && (
          <div className="modal modal-open">
            <div className="modal-box rounded-3xl bg-base-100 border border-base-300 shadow-2xl p-6">
              <div className="flex items-center gap-3 text-error mb-4">
                <div className="p-3 bg-error/10 rounded-2xl">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-bold text-xl text-base-content">Confirm Permanent Deletion</h3>
              </div>
              <p className="py-2 text-base-content/70">
                Are you sure you want to permanently delete <strong className="text-base-content font-bold">"{problemToDelete.title}"</strong>? 
                This action will also erase all user submission histories associated with this problem.
              </p>
              <div className="modal-action gap-2 mt-6">
                <button 
                  onClick={() => setProblemToDelete(null)} 
                  disabled={isDeleting}
                  className="btn btn-ghost rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="btn btn-error rounded-xl font-bold gap-2 shadow-md"
                >
                  {isDeleting ? <span className="loading loading-spinner loading-sm"></span> : (
                    <>
                      <Trash2 size={16} />
                      <span>Yes, Delete Forever</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setProblemToDelete(null)}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDelete;