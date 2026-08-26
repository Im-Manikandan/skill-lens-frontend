// Imports
import React from 'react';
import { Link } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
  Navbar,
  Nav,
  NavItem,
  NavbarBrand,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  Button,
} from 'reactstrap';
import { Menu, Bell } from 'lucide-react';
import { ReactComponent as LogoDarkIcon } from '../../assets/images/logos/skill_lens_logo.svg';
import { ReactComponent as LogoWhiteIcon } from '../../assets/images/logos/skill_lens_logo.svg';
import { decompressFflate } from '@devopsthink/react-security-util';
import Logo from '../logo/Logo';
import NameAvatar from '../logo/NameAvatar';
import { ToggleMiniSidebar, ToggleMobileSidebar } from '../../store/customizer/CustomizerSlice';
import ProfileDD from './ProfileDD';

const Header = () => {
  // Redux State & Dispatch
  const isDarkMode = useSelector((state) => state.customizer.isDark);
  const topbarColor = useSelector((state) => state.customizer.topbarBg);
  const dispatch = useDispatch();

  // User Info
  const compressedUserInfo = useSelector((state) => state.userInfo?.userInfo);
  const userInfo = compressedUserInfo
    ? JSON.parse(decompressFflate(compressedUserInfo))
    : null;
  const userName = userInfo?.name || userInfo?.fullName || userInfo?.username || 'Guest User';

  return (
    <>
      <Navbar
        color={topbarColor}
        dark={!isDarkMode}
        light={isDarkMode}
        expand="lg"
        className="topbar"
        style={{
          background: 'rgba(11, 17, 32, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Logo */}
        <div className="d-none d-lg-flex align-items-center logo-space">
          <Logo />
          <span className="d-sm-block d-lg-none">
            <Button
              close
              size="sm"
              className="ms-auto"
              onClick={() => dispatch(ToggleMobileSidebar())}
            />
          </span>
        </div>
        {/* Sidebar Toggle & Mobile Nav */}
        <div className="d-flex align-items-center me-auto">
          <button
            className="d-none d-lg-flex mx-1 hov-dd"
            onClick={() => dispatch(ToggleMiniSidebar())}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 10,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <Menu size={18} />
          </button>
          <NavbarBrand href="/" className="d-sm-block d-lg-none">
            {isDarkMode || topbarColor !== 'white' ? (
              <LogoWhiteIcon />
            ) : (
              <LogoDarkIcon />
            )}
          </NavbarBrand>
          <Button
            color={topbarColor}
            className="d-sm-block d-lg-none border-0 mx-1 hov-dd"
            onClick={() => dispatch(ToggleMobileSidebar())}
          >
            <i className="bi bi-list" />
          </Button>
        </div>

        {/* Left Nav Bar (disabled) */}
        {/* <Nav className="me-auto d-flex flex-row align-items-center" navbar>
          <NavItem className="d-md-block d-none">
            <Link
              to="/about"
              className={`nav-link hov-dd ${topbarColor === 'white' ? 'text-dark' : ''}`}
            >
              About
            </Link>
          </NavItem>
        </Nav> */}

        {/* Right Actions (Notifications & Profile) */}
        <div className="d-flex align-items-center gap-2">
          {/* Notification Bell */}
          {/*<button
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <Bell size={17} />
            <div style={{
              position: 'absolute', top: 6, right: 7,
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: '#60a5fa',
              boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)',
            }} />
          </button>*/}

          {/* Profile Dropdown */}
          <UncontrolledDropdown>
            <DropdownToggle
              color="transparent"
              className="hov-dd"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                padding: '5px 10px 5px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <NameAvatar name={userName} size={28} fontSize={11} />
              <span className="d-none d-md-block" style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#e2e8f0',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {userName}
              </span>
            </DropdownToggle>
            <DropdownMenu className="ddWidth profile-dd">
              <ProfileDD />
            </DropdownMenu>
          </UncontrolledDropdown>
        </div>
      </Navbar>
    </>
  );
};

export default Header;
