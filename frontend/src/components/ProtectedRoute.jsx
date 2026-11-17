import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa]">
        <img
          src={logo}
          alt="Baatein"
          className="h-20 w-20 animate-pulse object-contain"
        />

        <p className="mt-4 text-sm font-medium tracking-wide text-gray-500">
          Loading Baatein...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
