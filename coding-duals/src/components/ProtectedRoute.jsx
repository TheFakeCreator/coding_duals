import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found. Redirecting to login.");
    return <Navigate to="/login" />;
  }
  return children;
}
