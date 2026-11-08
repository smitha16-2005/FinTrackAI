import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111312] flex items-center justify-center text-[#A4ADA5]">
        Loading FinTrack AI...
      </div>
    );
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
}