// Imports
import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { decompressFflate } from '@devopsthink/react-security-util';
import { ReactComponent as LogoDarkIcon } from '../../assets/images/logos/skill_lens_logo.svg';
import ClientsController from '../../api/admin/clients-controller';

const Logo = () => {
  // Redux State & Client Info
  const userType = useSelector((state) => state.userType.userType);
  const compressedClientInfo = useSelector((state) => state.clientInfo.clientInfo);
  const clientInfo = compressedClientInfo
    ? JSON.parse(decompressFflate(compressedClientInfo))
    : null;
  const clientId = clientInfo?.client_id;

  // Fetch Client Logo
  const { data: logoData } = useQuery({
    queryKey: ['clientLogo', clientId],
    queryFn: () => ClientsController.getClientLogo(clientId),
    enabled: userType === 'client' && !!clientId,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  // Build Logo Source
  const clientLogoSrc = logoData?.logo
    ? `data:image/png;base64,${logoData.logo}`
    : null;

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Client Logo or Default App Logo */}
      {userType === 'client' && clientLogoSrc ? (
        <img
          src={clientLogoSrc}
          alt="Client Logo"
          style={{ width: 33, height: 31, objectFit: 'contain' }}
        />
      ) : (
        <LogoDarkIcon />
      )}
    </div>
  );
};

export default Logo;
