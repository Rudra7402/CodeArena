import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosclient';
import { NavLink } from 'react-router';
import { ArrowLeft, Search, Upload, Trash2, Video, AlertCircle, Filter, Tag, AlertTriangle } from 'lucide-react';

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [videoToWatch, setVideoToWatch] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/video/admin/problemsWithVideo');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      setIsDeleting(true);
      await axiosClient.delete(`/video/delete/${videoToDelete._id}`);
      alert('Video deleted successfully!');
      setProblems(prev => prev.map(p => p._id === videoToDelete._id ? { ...p, hasVideo: false, secureUrl: null } : p));
      setVideoToDelete(null);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(`Error deleting video: ${errMsg}`);
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
          <span className="badge badge-primary font-semibold px-3 py-3 gap-1">
            <Video size={14} />
            Video Walkthroughs
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {error && (
          <div className="alert alert-error shadow-lg mb-6 rounded-2xl border border-error/20">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="font-medium">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-base-content">Video Editorial Management</h1>
            <p className="text-base-content/60">Upload video solutions for coding problems or delete existing walkthroughs.</p>
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
            placeholder="Search problems to upload or delete video..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl bg-base-100 shadow-sm focus:border-primary"
          />
        </div>

        {/* Problem Table Card */}
        <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th className="w-1/12 py-4 pl-6">#</th>
                  <th className="w-4/12 py-4">Title</th>
                  <th className="w-2/12 py-4">Difficulty</th>
                  <th className="w-2/12 py-4">Video Status</th>
                  <th className="w-3/12 py-4 text-right pr-6">Actions</th>
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
                        {problem.hasVideo ? (
                          <span className="badge badge-success gap-1 text-xs font-bold px-3 py-2.5">
                            ✅ Video Available
                          </span>
                        ) : (
                          <span className="badge badge-ghost gap-1 text-xs font-semibold px-3 py-2.5 opacity-60">
                            ⚠️ No Video
                          </span>
                        )}
                      </td>
                      <td className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          {problem.hasVideo && (
                            <button
                              onClick={() => setVideoToWatch(problem)}
                              className="btn btn-sm btn-info gap-1.5 font-bold rounded-xl shadow-sm text-info-content"
                            >
                              <Video size={14} />
                              Watch
                            </button>
                          )}
                          {!problem.hasVideo ? (
                            <NavLink 
                              to={`/admin/upload/${problem._id}`}
                              className="btn btn-sm btn-primary gap-1.5 font-bold rounded-xl shadow-sm"
                            >
                              <Upload size={14} />
                              Upload
                            </NavLink>
                          ) : (
                            <button 
                              disabled
                              className="btn btn-sm btn-disabled gap-1.5 font-bold rounded-xl opacity-30 cursor-not-allowed"
                              title="Video already uploaded. Delete existing video first to upload a new one."
                            >
                              <Upload size={14} />
                              Upload
                            </button>
                          )}
                          {problem.hasVideo ? (
                            <button 
                              onClick={() => setVideoToDelete(problem)}
                              className="btn btn-sm btn-outline btn-error gap-1.5 font-bold rounded-xl"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="btn btn-sm btn-outline btn-disabled gap-1.5 font-bold rounded-xl opacity-30 cursor-not-allowed"
                              title="No video available to delete"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {videoToDelete && (
          <div className="modal modal-open">
            <div className="modal-box rounded-3xl bg-base-100 border border-base-300 shadow-2xl p-6">
              <div className="flex items-center gap-3 text-error mb-4">
                <div className="p-3 bg-error/10 rounded-2xl">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-bold text-xl text-base-content">Confirm Video Deletion</h3>
              </div>
              <p className="py-2 text-base-content/70">
                Are you sure you want to delete the solution video for <strong className="text-base-content font-bold">"{videoToDelete.title}"</strong>? 
                The coding problem itself will remain on the platform.
              </p>
              <div className="modal-action gap-2 mt-6">
                <button 
                  onClick={() => setVideoToDelete(null)} 
                  disabled={isDeleting}
                  className="btn btn-ghost rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteVideo}
                  disabled={isDeleting}
                  className="btn btn-error rounded-xl font-bold gap-2 shadow-md"
                >
                  {isDeleting ? <span className="loading loading-spinner loading-sm"></span> : (
                    <>
                      <Trash2 size={16} />
                      <span>Yes, Delete Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setVideoToDelete(null)}></div>
          </div>
        )}

        {/* Watch Video Modal */}
        {videoToWatch && (
          <div className="modal modal-open">
            <div className="modal-box rounded-3xl bg-base-100 border border-base-300 shadow-2xl p-6 max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-base-content flex items-center gap-2">
                  <Video className="text-info" size={24} />
                  <span>Video Walkthrough: "{videoToWatch.title}"</span>
                </h3>
                <button
                  onClick={() => setVideoToWatch(null)}
                  className="btn btn-sm btn-circle btn-ghost font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner border border-base-300">
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={videoToWatch.secureUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="modal-action gap-2 mt-6 justify-between">
                <button
                  onClick={() => {
                    setVideoToDelete(videoToWatch);
                    setVideoToWatch(null);
                  }}
                  className="btn btn-error rounded-xl font-bold gap-2 shadow-md"
                >
                  <Trash2 size={16} />
                  Delete This Video
                </button>
                <button
                  onClick={() => setVideoToWatch(null)}
                  className="btn btn-ghost rounded-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setVideoToWatch(null)}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideo;