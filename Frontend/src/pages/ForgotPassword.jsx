import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NavLink } from 'react-router';
import Navbar from '../components/Navbar';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import axiosClient from '../utils/axiosclient';

const forgotPasswordSchema = z.object({
  emailId: z.string().email("Invalid Email Address"),
});

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const response = await axiosClient.post('/user/forgot-password', data);
      setSuccessMessage(response.data.message || 'Password reset link sent successfully! Check your console or email.');
    } catch (error) {
      setErrorMessage(error.response?.data || error.message || 'Something went wrong. Please try again.');
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
            
            {/* Back to Login Link */}
            <NavLink to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline mb-6">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </NavLink>

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-base-content">Forgot password?</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="alert alert-error text-sm py-3 mb-5">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="alert alert-success text-sm py-3 mb-5">
                <span>{successMessage}</span>
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-full h-11 min-h-0 font-bold mt-2 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Sending link...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}

            {successMessage && (
              <div className="text-center mt-4">
                <p className="text-xs text-base-content/50">
                  Didn't receive the email? Double-check your spam folder or try requesting a new link.
                </p>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="btn btn-outline btn-sm font-semibold mt-4"
                >
                  Resend Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
