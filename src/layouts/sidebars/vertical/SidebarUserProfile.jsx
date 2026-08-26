// Imports
import React from 'react';
import NameAvatar from '../../logo/NameAvatar';

const SidebarUserProfile = ({ userName, userEmail, clientName }) => (
  <div className="py-3 px-4 d-flex align-items-center border-bottom-sidebar">
    {/* Avatar */}
    <NameAvatar name={userName} size={36} fontSize={13} borderRadius={12} />
    {/* User Details */}
    <div className="ms-3 hide-mini" style={{ minWidth: 0, flex: 1 }}>
      {/* User Name */}
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
      {/* Client Name */}
      {clientName && (
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#B3D335',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: 2,
        }}>
          {clientName}
        </div>
      )}
      {/* Email */}
      {userEmail && (
        <div style={{
          fontSize: 11,
          color: '#6b7280',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: 1,
        }}>
          {userEmail}
        </div>
      )}
    </div>
  </div>
);

export default SidebarUserProfile;
