import * as Icon from 'react-feather';

// Admin Sidebar Navigation Items
const AdminSidebarData = [
    {caption: 'Admin'},
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: <Icon.Home/>,
        id: 2.1,
        collapisble: false,
    },
    {
        title: 'Industries',
        href: '/admin/industries-management',
        icon: <Icon.Briefcase/>,
        id: 2.1,
        collapisble: false,
    },
    {
        title: 'Clients',
        href: '/admin/clients-management',
        icon: <Icon.Users/>,
        id: 2.1,
        collapisble: false,
    },
    {
        title: 'Users',
        href: '/admin/users-management',
        icon: <Icon.UserCheck/>,
        id: 2.1,
        collapisble: false,
    }
];

export default AdminSidebarData;
