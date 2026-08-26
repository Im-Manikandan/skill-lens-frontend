// Imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/Store';
import App from './App';
import './data';
import ErrorBoundary from 'src/error/ErrorBoundary.jsx';
import { queryClient } from 'src/config/query-config.jsx';
import { QueryClientProvider } from '@tanstack/react-query';
import useLogoutSync from './hooks/useLogoutSync.jsx';

// Cross-Tab Logout Synchronization Listener
const LogoutSyncListener = () => {
  useLogoutSync();
  return null;
};

// Application Root Render with Provider Setup
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <LogoutSyncListener />
          <App />
          {/*<ReactQueryDevtools initialIsOpen={true} />*/}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
  ,
);
