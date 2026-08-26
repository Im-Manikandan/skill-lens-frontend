// Imports
import { Navigate, Outlet } from 'react-router';
import { useSelector } from 'react-redux';

// Role-Based Route Guard
const ProtectedRoute = ({ requiredRole }) => {
    // Auth State Selectors
    const accessToken = useSelector((state) => state.auth.accessToken);
    const userType = useSelector((state) => state.userType.userType);

    // No token at all — nothing to preserve, send through the normal logout/login flow.
    if (!accessToken) {
        const logoutType = requiredRole.toUpperCase();
        return <Navigate to={`/auth/logout?USER_TYPE=${logoutType}`} replace />;
    }

    // Authenticated, but as the wrong role for this route (e.g. a Client
    // session hitting an /admin/* URL) — show Access Denied instead of
    // logging the user out. The session, tokens, and redux auth state are
    // left untouched; this route never dispatches or clears anything.
    if (userType !== requiredRole) {
        return <Navigate to="/error/403" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
