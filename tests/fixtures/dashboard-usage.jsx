import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import {QueryClient, QueryClientProvider, focusManager, onlineManager} from '@tanstack/react-query';
import {queryClient as appQueryClient} from '../../src/config/query-config.jsx';
import {store, persistor} from '../../src/store/Store.js';
import {setUserType} from '../../src/store/apps/auth/UserTypeSlice.js';
import ApiUtils from '../../src/api/ApiUtils.jsx';
import AdminAIUsageDashboard from '../../src/pages/analytics/AdminAIUsageDashboard.jsx';

await new Promise(resolve => {
  if (persistor.getState().bootstrapped) return resolve();
  const unsubscribe = persistor.subscribe(() => {
    if (persistor.getState().bootstrapped) {unsubscribe(); resolve();}
  });
});
persistor.pause();
window.mountUsageDashboard = (token = 'synthetic-fixture') => {
  store.dispatch(setUserType('admin'));
  ApiUtils.setCookie('accessToken', token);
  const defaults = appQueryClient.getDefaultOptions();
  const client = new QueryClient({defaultOptions:{...defaults,queries:{...defaults.queries,retry:false}}});
  createRoot(document.getElementById('usage-test-root')).render(
    <QueryClientProvider client={client}><BrowserRouter><AdminAIUsageDashboard /></BrowserRouter></QueryClientProvider>,
  );
};

// Expose browser focus/connectivity signals without changing production code.
window.setUsageFocused = value => focusManager.setFocused(value);
window.setUsageOnline = value => onlineManager.setOnline(value);
