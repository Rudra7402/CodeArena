import { NavLink } from 'react-router';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Navbar from '../components/Navbar';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content transition-colors duration-300">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full p-8 bg-base-100 rounded-2xl shadow-xl border border-base-300 transform transition-all duration-300 hover:shadow-2xl">
          {/* Animated 404 Icon Header */}
          <div className="flex justify-center mb-6 relative">
            <div className="p-5 bg-error/10 text-error rounded-full animate-bounce">
              <FileQuestion className="w-16 h-16" />
            </div>
            <span className="absolute -top-3 -right-3 px-3 py-1 bg-error text-error-content text-xs font-black rounded-full uppercase tracking-wider shadow">
              404
            </span>
          </div>

          {/* Error Text */}
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Page Not Found</h1>
          <p className="text-base-content/60 text-sm mb-8 leading-relaxed">
            Oops! The page you are looking for does not exist or has been moved. Double check the URL or try searching again.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <NavLink
              to="/problems"
              className="btn btn-primary font-bold flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Problems
            </NavLink>
            <button
              onClick={() => window.history.back()}
              className="btn btn-outline border-base-300 hover:bg-base-200/50 text-base-content font-bold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
