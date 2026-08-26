// Imports
import {lazy} from 'react';
import {Navigate} from 'react-router';
import Loadable from '../layouts/loader/Loadable';
import RootErrorBoundary from "../error/RootErrorBoundary.jsx";
import LoginAdmin from "../pages/auth/LoginAdmin.jsx";
import LoginClient from "../pages/auth/LoginClient.jsx";
import {ClientRouter} from "src/routes/ClientRouter.jsx";
import {AdminRouter} from "src/routes/AdminRouter.jsx";
import ProtectedRoute from "src/routes/ProtectedRoute.jsx";

// Lazy-Loaded Layouts
const FullLayout = Loadable(lazy(() => import('../layouts/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/BlankLayout')));

// Lazy-Loaded Auth & Error Pages
const Error = Loadable(lazy(() => import('../views/auth/Error')));
const Forbidden = Loadable(lazy(() => import('../views/auth/Forbidden')));
const Maintenance = Loadable(lazy(() => import('../views/auth/./Maintenance')));
const Logout = Loadable(lazy(() => import('../pages/auth/Logout')));
const ClientAuthorized = Loadable(lazy(() => import('../pages/auth/ClientAuthorized')));
const AdminAuthorized = Loadable(lazy(() => import('../pages/auth/AdminAuthorized')));
const RecoverPassword = Loadable(lazy(() => import('../views/auth/RecoverPassword')));
const InfographicPrintPage = Loadable(lazy(() => import('../pages/print/InfographicPrintPage')));

// Route Definitions
const ThemeRoutes = [
    // Root Redirect
    {
        path: '/',
        Component: BlankLayout,
        ErrorBoundary: RootErrorBoundary,
        children: [
            {path: '/', name: 'Home', element: <Navigate to="/auth/login/client"/>},
        ],
    },
    // Protected Admin Routes
    {
        path: '/admin',
        element: <ProtectedRoute requiredRole="admin" />,
        ErrorBoundary: RootErrorBoundary,
        children: [{
            Component: FullLayout,
            children: AdminRouter,
        }],
    },
    // Protected Client Routes
    {
        path: '/client',
        element: <ProtectedRoute requiredRole="client" />,
        ErrorBoundary: RootErrorBoundary,
        children: [{
            Component: FullLayout,
            children: ClientRouter,
        }],
    },
    // Auth Pages (Public)
    {
        path: '/auth',
        Component: BlankLayout,
        ErrorBoundary: RootErrorBoundary,
        children: [
            {path: '*', element: <Navigate to="/error/404"/>},
            {path: 'login/admin', element: <LoginAdmin/>},
            {path: 'login/client', element: <LoginClient/>},
            {path: 'maintenance', element: <Maintenance/>},
            {path: 'logout', element: <Logout/>},
            {path: 'client/authorized', element: <ClientAuthorized/>},
            {path: 'admin/authorized', element: <AdminAuthorized/>},
            {path: 'recoverpwd', element: <RecoverPassword/>},
        ],
    },
    // Print Routes (Public) — headless-browser-only, see InfographicPrintPage.jsx
    // for why this deliberately has no ProtectedRoute/auth requirement.
    {
        path: '/print',
        Component: BlankLayout,
        ErrorBoundary: RootErrorBoundary,
        children: [
            {path: 'infographic-report/:token', element: <InfographicPrintPage/>},
        ],
    },
    // Error Pages
    {
        path: '/error',
        Component: BlankLayout,
        ErrorBoundary: RootErrorBoundary,
        children: [
            {path: '404', element: <Error/>},
            {path: '403', element: <Forbidden/>},
        ],
    },
];

export default ThemeRoutes;
