// Imports
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthToken } from '../store/apps/auth/AuthSlice';
import { clearUserType } from '../store/apps/auth/UserTypeSlice';
import { clearUserInfo } from '../store/apps/auth/UserInfoSlice';
import { clearClientInfo } from '../store/apps/client/ClientInfoSlice';

const PERSIST_KEY = 'persist:root';

// Cross-Tab Logout Synchronization Hook
export default function useLogoutSync() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  // Listen for localStorage Clear Events from Other Tabs
  useEffect(() => {
    function handleStorageChange(event) {
      const isFullClear = event.key === null;
      const isPersistCleared =
        event.key === PERSIST_KEY && (event.newValue === null || event.newValue === '');

      if (!isFullClear && !isPersistCleared) return;
      if (!accessTokenRef.current) return;

      // Clear All Auth State in Current Tab
      dispatch(clearAuthToken());
      dispatch(clearUserType());
      dispatch(clearUserInfo());
      dispatch(clearClientInfo());
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);
}
