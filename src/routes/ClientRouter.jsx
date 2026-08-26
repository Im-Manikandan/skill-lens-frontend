// Imports
import { lazy } from 'react';
import Loadable from '../layouts/loader/Loadable';
import {Navigate} from "react-router";

// Lazy-Loaded Client Pages
const ClientSelect = Loadable(lazy(() => import("../pages/client/ClientSelect.jsx")));
const ClientDashboard = Loadable(lazy(() => import("../pages/client/ClientDashboard")));
const SearchInterface = Loadable(lazy(() => import("../pages/client/search/SearchInterface.jsx")));
const MyAccount = Loadable(lazy(() => import("../pages/client/MyAccount.jsx")));

// Client Route Definitions
export const ClientRouter = [
    {
        path: 'select',
        name: 'ClientSelect',
        exact: true,
        element: <ClientSelect/>
    },
    {
        path: 'dashboard',
        name: 'ClientDashboard',
        exact: true,
        element: <ClientDashboard/>
    },
    {
        path: 'search-interface',
        name: 'SearchInterface',
        exact: true,
        element: <SearchInterface/>
    },
    {
        path: 'my-account',
        name: 'MyAccount',
        exact: true,
        element: <MyAccount/>
    },
    {path: '*', element: <Navigate to="/error/404"/>},

];