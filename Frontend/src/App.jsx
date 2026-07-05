import { Routes, Route, Navigate } from "react-router";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage"; // Public landing page for unauthenticated users
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './authslice';
import { useEffect } from "react";
import ProblemPage from "./pages/ProblemPage";
import AdminPanel from "./components/AdminPanel";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete";
import AdminUpdate from "./components/AdminUpdate";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import Playground from "./pages/Playground"; // Public online compiler page
import Premium from "./pages/Premium"; // Premium purchase page
import Profile from "./pages/Profile"; // User stats and settings page
import Leaderboard from "./pages/Leaderboard"; // Global leaderboard page
import PaymentSuccess from "./pages/PaymentSuccess"; // Stripe checkout success page
import NotFound from "./pages/NotFound";

function App() {

  const dispatch = useDispatch();
  const { isAuthenticated, user, initializing } = useSelector((state) => state.auth);

  // check initial authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (initializing) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return (
    <>
      <Routes>
        {/* Landing page: shown to unauthenticated users, redirect authenticated users to /problems */}
        <Route path="/landing" element={isAuthenticated ? <Navigate to="/problems" /> : <LandingPage />}></Route>
        {/* Root /: authenticated users go to problems list, guests see the landing page */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/problems" /> : <LandingPage />}></Route>
        {/* /problems: PUBLIC route - both guests and logged-in users can view the problems list */}
        <Route path="/problems" element={<Homepage />}></Route>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/problems" /> : <Login></Login>}></Route>
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/problems" /> : <Signup></Signup>}></Route>
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/problems" /> : <ForgotPassword />}></Route>
        <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/problems" /> : <ResetPassword />}></Route>
        <Route path="problem/:problemId" element={<ProblemPage />}></Route>
        {/* /playground: PUBLIC route - any user can use the online compiler */}
        <Route path="/playground" element={<Playground />}></Route>
        {/* /premium: PUBLIC route - view subscription benefits */}
        <Route path="/premium" element={<Premium />}></Route>
        <Route path="/payment-success" element={<PaymentSuccess />}></Route>
        {/* /profile: PROTECTED route - user settings and statistics */}
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}></Route>
        {/* /profile/:userId: PUBLIC route - view public shareable stats of another user */}
        <Route path="/profile/:userId" element={<Profile />}></Route>
        {/* /leaderboard: PUBLIC route - view global rankings */}
        <Route path="/leaderboard" element={<Leaderboard />}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />}></Route>
        <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to='/' />}></Route>
        <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <AdminUpdate /> : <Navigate to="/" />}></Route>
        <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />}></Route>
        <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />}></Route>
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />}></Route>
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </>
  )
}

export default App;