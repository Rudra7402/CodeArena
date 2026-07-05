import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import axiosClient from '../utils/axiosclient';
import { checkAuth } from '../authslice';
import Navbar from '../components/Navbar';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }
      try {
        const res = await axiosClient.get(`/payment/verify/${sessionId}`);
        if (res.data.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setStatus('error');
      }
    };

    verify();
  }, [sessionId, dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-base-100 max-w-md w-full rounded-2xl shadow-xl border border-base-300 p-8 text-center space-y-6">
          {status === 'verifying' && (
            <div className="py-12 space-y-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm font-semibold text-base-content/70">Verifying your payment with Stripe...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6 animate-fade-in">
              <CheckCircle2 className="w-20 h-20 text-success mx-auto" />
              <div>
                <h2 className="text-2xl font-extrabold text-base-content">Payment Successful!</h2>
                <p className="text-sm text-base-content/60 mt-2">
                  Welcome to CodeArena PRO! Your lifetime membership is now active.
                </p>
              </div>
              <button
                onClick={() => {
                  dispatch(checkAuth());
                  navigate('/problems');
                }}
                className="btn btn-primary w-full font-bold gap-2"
              >
                <span>Start Solving PRO Problems</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 animate-fade-in">
              <XCircle className="w-20 h-20 text-error mx-auto" />
              <div>
                <h2 className="text-2xl font-extrabold text-base-content">Payment Verification Failed</h2>
                <p className="text-sm text-base-content/60 mt-2">
                  We could not verify your checkout session. If money was deducted, please contact support.
                </p>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="btn btn-outline w-full font-bold"
              >
                Back to Pricing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
