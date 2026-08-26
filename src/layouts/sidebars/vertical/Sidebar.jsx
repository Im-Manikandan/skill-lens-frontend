// Imports
import React from 'react';
import { Nav } from 'reactstrap';
import { useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { decompressFflate } from '@devopsthink/react-security-util';
import SimpleBar from 'simplebar-react';
import AdminSidebarData from '../sidebardata/AdminSidebarData.jsx';
import ClientSidebarData from '../sidebardata/ClientSidebarData.jsx';
import NavItemContainer from './NavItemContainer';
import NavSubMenu from './NavSubMenu';
import SidebarUserProfile from './SidebarUserProfile';
import useMyClients from '../../../hooks/query/useMyClients.jsx';

const Sidebar = () => {
  // Route & Redux State
  const location = useLocation();
  const currentURL = location.pathname.split('/').slice(0, -1).join('/');

  const activeBg = useSelector((state) => state.customizer.sidebarBg);
  const isFixed = useSelector((state) => state.customizer.isSidebarFixed);
  const userType = useSelector((state) => state.userType.userType);

  // User Info from Redux
  const compressedUserInfo = useSelector((state) => state.userInfo?.userInfo);
  const userInfo = compressedUserInfo
    ? JSON.parse(decompressFflate(compressedUserInfo))
    : null;
  const userName = userInfo?.name ?? 'Guest User';
  const userEmail = userInfo?.email || userInfo?.emailAddress || '';

  // Client Info from Redux
  const compressedClientInfo = useSelector((state) => state.clientInfo?.clientInfo);
  const clientInfo = compressedClientInfo
    ? JSON.parse(decompressFflate(compressedClientInfo))
    : null;
  const clientName = clientInfo?.client_name ?? '';

  // Sidebar Data Selection & Filtering
  const {data: clients = []} = useMyClients();
  const rawSidebarData = userType === 'client' ? ClientSidebarData : AdminSidebarData;
  // Hide "Switch Account" when user has only one client
  const sidebarData = userType === 'client' && clients.length <= 1
    ? rawSidebarData.filter((item) => item.href !== '/client/select')
    : rawSidebarData;

  return (
    <div className={`sidebarBox shadow bg-${activeBg} ${isFixed ? 'fixedSidebar' : ''}`}>
      <SimpleBar style={{ height: '100%' }}>
        {/* User Profile Section */}
        {userType === 'client' && <SidebarUserProfile userName={userName} userEmail={userEmail} clientName={clientName} />}
        {/* Navigation Items */}
        <div className="p-3">
          <Nav vertical className={activeBg === 'white' ? '' : 'lightText'}>
            {sidebarData.map((navi) => {
              if (navi.caption) {
                return (
                  <div className="navCaption text-uppercase mt-4" key={navi.caption}>
                    {navi.caption}
                  </div>
                );
              }
              if (navi.children) {
                return (
                  <NavSubMenu
                    key={navi.id}
                    icon={navi.icon}
                    title={navi.title}
                    items={navi.children}
                    suffix={navi.suffix}
                    suffixColor={navi.suffixColor}
                    isUrl={currentURL === navi.href}
                  />
                );
              }
              return (
                <NavItemContainer
                  key={navi.id}
                  className={location.pathname === navi.href ? 'activeLink' : ''}
                  to={navi.href}
                  title={navi.title}
                  suffix={navi.suffix}
                  suffixColor={navi.suffixColor}
                  icon={navi.icon}
                />
              );
            })}
          </Nav>
        </div>
      </SimpleBar>
    </div>
  );
};

export default Sidebar;
