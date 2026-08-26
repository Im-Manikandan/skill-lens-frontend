import * as Icon from 'react-feather';

// Client Sidebar Navigation Items
const ClientDashboard = [
    {caption: 'Client'},
    {
        title: 'Home',
        href: '/client/dashboard',
        icon: <Icon.Home/>,
        id: 1.1,
        collapisble: false,
    },
    {
        title: 'Search',
        href: '/client/search-interface',
        icon: <Icon.Search/>,
        id: 1.2,
        collapisble: false,
    },
    {
        title: 'My Account',
        href: '/client/my-account',
        icon: <Icon.CreditCard/>,
        id: 1.5,
        collapisble: false,
    },
    {
        title: 'Switch Account',
        href: '/client/select',
        icon: <Icon.RefreshCw/>,
        id: 1.6,
        collapisble: false,
    },
];

export default ClientDashboard;
