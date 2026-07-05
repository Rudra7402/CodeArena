import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, NavLink } from 'react-router';
import Navbar from '../components/Navbar';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import axiosClient from '../utils/axiosclient';

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await axiosClient.post(`/user/reset-password/${token}`, { password: data.password });
      setSuccess(true);
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data || error.message || 'Token is invalid or has expired. Please request a new password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200 transition-colors duration-300">
      {/* Navigation Bar */}
      <Navbar />

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-300 w-full max-w-md overflow-hidden">
          <div className="p-8">
            
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-base-content">Reset password</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Enter your new password below to secure your account.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="alert alert-error text-sm py-3 mb-5">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success View */}
            {success ? (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-success animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-base-content">Password Reset Complete!</h3>
                <p className="text-sm text-base-content/60">
                  Your password has been successfully updated. You will be redirected to the sign in page shortly.
                </p>
                <div className="pt-2">
                  <NavLink to="/login" className="btn btn-primary btn-md font-bold gap-2">
                    Go to Sign In
                    <ArrowRight className="w-4 h-4" />
                  </NavLink>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1.5">
                    New Password
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
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-error text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`input input-bordered w-full px-10 h-11 text-sm ${errors.confirmPassword ? 'input-error' : ''}`}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>
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
                      Updating password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
