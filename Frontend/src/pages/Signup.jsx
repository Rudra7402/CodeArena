import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authslice';
import { clearError } from '../authslice';
import Navbar from '../components/Navbar';
import { Code2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axiosClient from '../utils/axiosclient';

const SignupSchema = z.object({
  firstName: z.string().min(3, "Minimum length of name should be 3"),
  emailId: z.string().email("Invalid EmailId"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(SignupSchema)
  });

  // Clear any stale error from a previous attempt as soon as this page mounts
  useEffect(() => {
    dispatch(clearError());
    setLocalError(null);
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLocalError(null);
    try {
      await dispatch(registerUser(data)).unwrap();
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : err?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">

      {/* Navigation Bar: shared component */}
      <Navbar />

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 w-full max-w-md overflow-hidden">
          <div className="p-8">

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-base-content">Create your account</h1>
              <p className="text-sm text-base-content/60 mt-1">Join CodeArena and start practicing DSA today.</p>
            </div>

            {/* Error Banner — only shown after a submission attempt */}
            {(localError || error) && (
              <div className="alert alert-error text-sm py-3 mb-5 shadow-md">
                <span>{typeof (localError || error) === 'string' ? (localError || error) : (localError || error)?.message || 'Registration failed. Please try again.'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* First Name Field */}
              <div>
                <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="John"
                    className={`input input-bordered w-full pl-10 h-11 text-sm ${errors.firstName ? 'input-error' : ''}`}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-error text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className={`input input-bordered w-full pl-10 h-11 text-sm ${errors.emailId ? 'input-error' : ''}`}
                    {...register('emailId')}
                  />
                </div>
                {errors.emailId && (
                  <p className="text-error text-xs mt-1">{errors.emailId.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`input input-bordered w-full px-10 h-11 text-sm ${errors.password ? 'input-error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-error text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-full h-11 min-h-0 font-bold mt-2 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
            {/* Divider */}
            <div className="divider text-xs text-base-content/40 my-5">OR</div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={() => {
                window.location.href = `${axiosClient.defaults.baseURL}/auth/google`;
              }}
              className="btn btn-outline w-full h-11 min-h-0 font-bold flex items-center justify-center gap-3 border-base-300 hover:bg-base-200/50 hover:text-base-content mb-5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Login redirect */}
            <p className="text-center text-sm text-base-content/60">
              Already have an account?{' '}
              <NavLink to="/login" className="link link-primary font-semibold">
                Sign In
              </NavLink>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Signup;