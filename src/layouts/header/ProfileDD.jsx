// Imports
import { useSelector } from 'react-redux';
import { DropdownItem } from 'reactstrap';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import { decompressFflate } from '@devopsthink/react-security-util';
import NameAvatar from '../logo/NameAvatar';

const ProfileDD = () => {
  // User Info from Redux
  const compressedUserInfo = useSelector((state) => state.userInfo?.userInfo);

  const userInfo = compressedUserInfo
    ? JSON.parse(decompressFflate(compressedUserInfo))
    : null;

  const userName = userInfo?.name || userInfo?.fullName || userInfo?.username || 'Guest User';
  const userEmail = userInfo?.email || userInfo?.emailAddress || 'user@example.com';

  return (
    <div>
      {/* Gradient accent bar */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #60a5fa, #818cf8, #a78bfa)',
      }} />

      {/* Profile header */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <NameAvatar name={userName} size={40} fontSize={14} borderRadius={12} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#f1f5f9',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {userName}
          </div>
          <div style={{
            fontSize: 12,
            color: '#6b7280',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 2,
          }}>
            {userEmail}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '6px 0' }}>
        <DropdownItem className="px-4 py-3 d-flex align-items-center gap-2">
          <User size={17} style={{ color: '#60a5fa' }} />
          <span>My Profile</span>
        </DropdownItem>
        <DropdownItem divider style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />
        <DropdownItem
          tag={Link}
          to="/auth/logout"
          className="px-4 py-3 d-flex align-items-center gap-2 text-danger"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </DropdownItem>
      </div>
    </div>
  );
};

export default ProfileDD;
