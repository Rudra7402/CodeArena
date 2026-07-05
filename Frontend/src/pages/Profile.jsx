import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, NavLink, useParams } from 'react-router';
import Navbar from '../components/Navbar';
import axiosClient from '../utils/axiosclient';
import { updateUser } from '../authslice';
import { User, Mail, Calendar, Settings, BarChart2, ShieldCheck, Lock, Edit, CheckCircle, ExternalLink, Share2 } from 'lucide-react';

function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams(); // Check if viewing a public profile page

  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'settings'
  const [profileData, setProfileData] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyShareLink = () => {
    if (!profileData?._id) return;
    const shareUrl = `${window.location.origin}/profile/${profileData._id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Settings form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [password, setPassword] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Redirect to login only if accessing own profile (no userId in route) while guest
  useEffect(() => {
    if (!userId && !user) {
      navigate('/login');
    }
  }, [userId, user, navigate]);

  // Fetch full profile info with populated solved problems list + all problems list
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // If userId parameter is present in URL, fetch from public endpoint, else private profile
        const profileEndpoint = userId ? `/user/profile/${userId}` : '/user/profile';

        // Call both APIs concurrently for efficiency
        const [profileRes, problemsRes] = await Promise.all([
          axiosClient.get(profileEndpoint),
          axiosClient.get('/problem/getAllProblems')
        ]);

        setProfileData(profileRes.data);
        setAllProblems(problemsRes.data || []);

        // Initialize form fields
        setFirstName(profileRes.data.firstName || '');
        setLastName(profileRes.data.lastName || '');
        setAge(profileRes.data.age || '');
        setDescription(profileRes.data.description || '');
        setLinkedinUrl(profileRes.data.linkedinUrl || '');
        setGithubUrl(profileRes.data.githubUrl || '');
      } catch (err) {
        setError(err.response?.data || 'Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    // If it's a public profile, we fetch it immediately. If it's own profile, fetch only when logged in
    if (userId || user) {
      fetchProfileData();
    }
  }, [userId, user]);



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    setUpdateError(null);

    try {
      const payload = {
        firstName,
        lastName,
        age: age ? Number(age) : undefined,
        description,
        linkedinUrl,
        githubUrl
      };
      if (password) {
        payload.password = password;
      }

      const response = await axiosClient.put('/user/profile', payload);

      // Update global Redux user auth state
      dispatch(updateUser(response.data.user));

      // Update local populated profile representation
      setProfileData(prev => ({
        ...prev,
        ...response.data.user
      }));

      // Clear password field and show success
      setPassword('');
      setUpdateSuccess(true);
    } catch (err) {
      setUpdateError(err.response?.data || 'Failed to update profile settings.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-base-200">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-base-200">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-error">Something went wrong</h2>
          <p className="text-sm text-base-content/60 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate difficulty stats
  const solvedList = profileData?.problemSolved || [];
  const totalSolved = solvedList.length;
  const totalProblemsCount = allProblems.length;
  const recentSolved = solvedList.slice(-10).reverse();

  const easySolved = solvedList.filter(p => p.difficulty === 'Easy').length;
  const mediumSolved = solvedList.filter(p => p.difficulty === 'Medium').length;
  const hardSolved = solvedList.filter(p => p.difficulty === 'Hard').length;

  // Calculate total problems of each difficulty in the DB
  const easyTotal = allProblems.filter(p => p.difficulty === 'Easy').length || 0;
  const mediumTotal = allProblems.filter(p => p.difficulty === 'Medium').length || 0;
  const hardTotal = allProblems.filter(p => p.difficulty === 'Hard').length || 0;

  // Calculate topic stats
  const topicCounts = {};
  solvedList.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(tag => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });
    }
  });
  const topicBreakdown = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">
      <Navbar />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-6 items-start">

        {/* ── LEFT PANEL: User Info Overview Column ── */}
        <div className="flex flex-col gap-6">

          {/* Card 1: Main details & metrics */}
          <div className="bg-base-100 rounded-2xl border border-base-300 p-6 flex flex-col items-center text-center shadow-sm gap-5">
            {/* Avatar Icon */}
            <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-3xl font-extrabold shadow-md">
              {profileData.firstName?.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2.5 w-full">
              <h2 className="text-2xl font-bold text-base-content flex items-center justify-center gap-1.5">
                {profileData.firstName} {profileData.lastName}
                {profileData.role === 'admin' && (
                  <span className="badge badge-warning text-xs font-semibold">Admin</span>
                )}
              </h2>

              {/* Email Address - only show on your own profile (privacy protection) */}
              {!userId && profileData.emailId && (
                <p className="text-sm text-base-content/60 flex items-center justify-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {profileData.emailId}
                </p>
              )}

              {/* Social Links - Larger Icon Sizes */}
              {(profileData.linkedinUrl || profileData.githubUrl) && (
                <div className="flex items-center justify-center gap-4 pt-1.5">
                  {profileData.linkedinUrl && (
                    <a
                      href={profileData.linkedinUrl.startsWith('http') ? profileData.linkedinUrl : `https://${profileData.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-md btn-ghost border border-base-300 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30 transition-all shadow-sm"
                      title="LinkedIn Profile"
                    >
                      <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                  {profileData.githubUrl && (
                    <a
                      href={profileData.githubUrl.startsWith('http') ? profileData.githubUrl : `https://${profileData.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-md btn-ghost border border-base-300 hover:text-base-content hover:bg-base-content/10 hover:border-base-content/30 transition-all shadow-sm"
                      title="GitHub Profile"
                    >
                      <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="divider my-0"></div>

            <div className="w-full text-left space-y-3.5 text-sm text-base-content/75">
              {/* Age - hide on public profile (privacy protection) */}
              {!userId && profileData.age && (
                <p className="flex justify-between">
                  <span className="font-semibold text-base-content/50">Age:</span>
                  <span>{profileData.age} years old</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="font-semibold text-base-content/50">Member Since:</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-base-content/40" />
                  {new Date(profileData.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-base-content/50">Total Solved:</span>
                <span className="badge badge-primary font-bold">{totalSolved} / {totalProblemsCount}</span>
              </p>
              <p className="flex justify-between items-center">
                <span className="font-semibold text-base-content/50">Daily Streak:</span>
                <span className="badge badge-warning text-warning-content font-bold flex gap-1 items-center">
                  🔥 {profileData.currentStreak || 0} Days <span className="text-[10px] opacity-75 font-medium">(Max: {profileData.maxStreak || 0})</span>
                </span>
              </p>

              {/* Copy Share Link Button (Only show to the profile owner under /profile) */}
              {!userId && (
                <button
                  onClick={copyShareLink}
                  className="btn btn-outline btn-primary btn-xs w-full py-2 h-auto text-[10px] font-bold uppercase tracking-wider rounded-lg mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      Share Profile Link
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Dedicated "About Me" box (only if description is filled out) */}
          {profileData.description && (
            <div className="bg-base-100 rounded-2xl border border-base-300 p-6 shadow-sm text-left flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-base-content/40 uppercase tracking-widest">About Me</h3>
              <p className="text-sm text-base-content/85 break-words whitespace-pre-wrap leading-relaxed">
                {profileData.description}
              </p>
            </div>
          )}

        </div>

        {/* ── RIGHT PANEL: Tabs Content ── */}
        <div className="md:col-span-2 bg-base-100 rounded-2xl border border-base-300 shadow-sm flex flex-col overflow-hidden">

          {/* Tabs Selector Bar */}
          <div className="flex border-b border-base-300 bg-base-300">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm border-b-2 transition-all ${activeTab === 'stats'
                ? 'border-primary text-primary bg-base-100'
                : 'border-transparent text-base-content/65 hover:text-base-content hover:bg-base-200/50'
                }`}
            >
              <BarChart2 className="w-4 h-4" />
              Stats Dashboard
            </button>
            {!userId && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm border-b-2 transition-all ${activeTab === 'settings'
                  ? 'border-primary text-primary bg-base-100'
                  : 'border-transparent text-base-content/65 hover:text-base-content hover:bg-base-200/50'
                  }`}
              >
                <Settings className="w-4 h-4" />
                Edit Settings
              </button>
            )}
          </div>

          <div className="p-6 md:p-8 flex-1">

            {/* ── TAB CONTENT: Stats Dashboard ── */}
            {activeTab === 'stats' && (
              <div className="space-y-8">

                {/* Solved Problems Breakdown Bar Charts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Difficulty Breakdown
                  </h3>

                  <div className="space-y-4">
                    {/* Easy Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-success">EASY</span>
                        <span>{easySolved} / {easyTotal} Solved</span>
                      </div>
                      <progress
                        className="progress progress-success w-full h-2.5"
                        value={easySolved}
                        max={easyTotal || 1} // avoid division by 0
                      ></progress>
                    </div>

                    {/* Medium Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-warning">MEDIUM</span>
                        <span>{mediumSolved} / {mediumTotal} Solved</span>
                      </div>
                      <progress
                        className="progress progress-warning w-full h-2.5"
                        value={mediumSolved}
                        max={mediumTotal || 1}
                      ></progress>
                    </div>

                    {/* Hard Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-error">HARD</span>
                        <span>{hardSolved} / {hardTotal} Solved</span>
                      </div>
                      <progress
                        className="progress progress-error w-full h-2.5"
                        value={hardSolved}
                        max={hardTotal || 1}
                      ></progress>
                    </div>
                  </div>
                </div>

                <div className="divider"></div>

                {/* Topics solved breakdown */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <Edit className="w-5 h-5 text-primary" />
                    Solved Topics
                  </h3>

                  {topicBreakdown.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {topicBreakdown.map(([tag, count]) => (
                        <div
                          key={tag}
                          className="badge badge-outline border-base-300 p-4 text-xs font-semibold flex gap-1.5 items-center hover:border-primary/50 transition-colors"
                        >
                          <span className="text-base-content/85">{tag}</span>
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50 italic py-2">
                      Start solving coding problems to see topic statistics here!
                    </p>
                  )}
                </div>

                <div className="divider"></div>

                {/* Recently Solved problems (Last 10) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Recently Solved (Last 10)
                  </h3>

                  {recentSolved.length > 0 ? (
                    <div className="space-y-3">
                      {recentSolved.map((problem) => (
                        <div
                          key={problem._id}
                          className="flex items-center justify-between p-3.5 bg-base-200/50 hover:bg-base-200 rounded-xl border border-base-300 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-success shrink-0" />
                            <NavLink
                              to={`/problem/${problem._id}`}
                              className="font-semibold text-sm text-base-content hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {problem.title}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                            </NavLink>
                          </div>

                          {/* Difficulty badge */}
                          <span
                            className={`badge badge-sm font-semibold uppercase ${problem.difficulty === 'Easy'
                              ? 'badge-success text-success-content'
                              : problem.difficulty === 'Medium'
                                ? 'badge-warning text-warning-content'
                                : 'badge-error text-error-content'
                              }`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50 italic py-2">
                      No problems solved recently. Let's solve your first problem!
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ── TAB CONTENT: Edit Settings Form ── */}
            {activeTab === 'settings' && (
              <form onSubmit={handleUpdateProfile} className="space-y-5">

                {/* Success/Error banners */}
                {updateSuccess && (
                  <div className="alert alert-success text-sm py-3 mb-2">
                    <span>Profile settings updated successfully!</span>
                  </div>
                )}
                {updateError && (
                  <div className="alert alert-error text-sm py-3 mb-2">
                    <span>{typeof updateError === 'string' ? updateError : updateError.message || 'Update failed'}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">FIRST NAME</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input input-bordered w-full text-sm h-11"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">LAST NAME</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input input-bordered w-full text-sm h-11"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">AGE</span>
                    </label>
                    <input
                      type="number"
                      placeholder="21"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="input input-bordered w-full text-sm h-11"
                    />
                  </div>

                  {/* Email ID (Immutable) */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">EMAIL ADDRESS (UNREADABLE)</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profileData.emailId}
                      className="input input-bordered w-full text-sm h-11 bg-base-200/50 text-base-content/40 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* LinkedIn URL */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">LINKEDIN URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="input input-bordered w-full text-sm h-11"
                    />
                  </div>

                  {/* GitHub URL */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs text-base-content/70">GITHUB URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="input input-bordered w-full text-sm h-11"
                    />
                  </div>
                </div>

                {/* Bio Description */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/70">BIO DESCRIPTION</span>
                  </label>
                  <textarea
                    placeholder="Tell us about yourself (e.g. your tech stack, goals, or placement target)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea textarea-bordered w-full text-sm min-h-24 resize-y"
                    maxLength={200}
                  />
                  <div className="label py-0.5 justify-end">
                    <span className="label-text-alt text-[10px] text-base-content/50">Max 200 characters</span>
                  </div>
                </div>

                {/* Password field */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content/70">CHANGE PASSWORD (LEAVE BLANK TO KEEP UNCHANGED)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input input-bordered w-full pl-10 text-sm h-11"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={updating}
                  className={`btn btn-primary h-11 min-h-0 font-bold w-full sm:w-auto px-6 ${updating ? 'loading' : ''}`}
                >
                  {updating ? 'Saving Details...' : 'Save Settings'}
                </button>

              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;
