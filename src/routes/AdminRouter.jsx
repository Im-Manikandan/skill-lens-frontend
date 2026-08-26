// Imports
import { lazy } from 'react';
import Loadable from '../layouts/loader/Loadable';
import {Navigate} from "react-router";

// Lazy-Loaded Admin Pages
const AdminDashboard = Loadable(lazy(() => import("../pages/admin/AdminDashboard")));
const IndustriesManagement = Loadable(lazy(() => import("../pages/admin/industries/IndustriesManagement.jsx")));
const ClientsManagement = Loadable(lazy(() => import("../pages/admin/clients/ClientsManagement.jsx")));
const SkillFrameworkManagement = Loadable(lazy(() => import("../pages/admin/skills/SkillFrameworkManagement.jsx")));
const SelfAssessmentManagement = Loadable(lazy(() => import("../pages/admin/skills/SelfAssessmentManagement.jsx")));
const UsersManagement = Loadable(lazy(() => import("../pages/admin/users/UsersManagement.jsx")));
const ProfilesManagement = Loadable(lazy(() => import("../pages/admin/profiles/ProfilesManagement.jsx")));
const ClientDimensionConfig = Loadable(lazy(() => import("../pages/admin/config/ClientDimensionConfig.jsx")));
const ClientHCMConfig = Loadable(lazy(() => import("../pages/admin/config/ClientHCMConfig.jsx")));
const ClientConfigHub = Loadable(lazy(() => import("../pages/admin/config/ClientConfigHub.jsx")));
const ClientSkillReadinessConfig = Loadable(lazy(() => import("../pages/admin/config/ClientSkillReadinessConfig.jsx")));

// Admin Route Definitions
export const AdminRouter = [
    {
        path: 'dashboard',
        name: 'AdminDashboard',
        exact: true,
        element: <AdminDashboard/>
    },
    {
        path: 'industries-management',
        name: 'IndustriesManagement',
        exact: true,
        element: <IndustriesManagement/>
    },
    {
        path: 'clients-management',
        name: 'ClientsManagement',
        exact: true,
        element: <ClientsManagement/>
    },
    {
        path: 'skill-framework-management',
        name: 'SkillFrameworkManagement',
        exact: true,
        element: <SkillFrameworkManagement/>
    },
    {
        path: 'skill-framework-management/:clientId',
        name: 'SkillFrameworkManagementByClient',
        exact: true,
        element: <SkillFrameworkManagement/>
    },
    {
        path: 'self-assessment-management/:frameworkId',
        name: 'SelfAssessmentManagement',
        exact: true,
        element: <SelfAssessmentManagement/>
    },
    {
        path: 'users-management',
        name: 'UsersManagement',
        exact: true,
        element: <UsersManagement/>
    },
    {
        path: 'profiles/:clientId',
        name: 'ProfilesManagement',
        exact: true,
        element: <ProfilesManagement/>
    },
    {
        path: 'client-config/:clientId',
        name: 'ClientDimensionConfig',
        exact: true,
        element: <ClientDimensionConfig/>
    },
    {
        path: 'hcm-config/:clientId',
        name: 'ClientHCMConfig',
        exact: true,
        element: <ClientHCMConfig/>
    },
    {
        path: 'config-hub/:clientId',
        name: 'ClientConfigHub',
        exact: true,
        element: <ClientConfigHub/>
    },
    {
        path: 'skill-readiness-config/:clientId',
        name: 'ClientSkillReadinessConfig',
        exact: true,
        element: <ClientSkillReadinessConfig/>
    },
    {path: '*', element: <Navigate to="/error/404"/>},
];