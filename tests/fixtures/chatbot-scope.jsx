import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import {compressFflate} from '@devopsthink/react-security-util';
import {store, persistor} from '../../src/store/Store.js';
import {setClientInfo} from '../../src/store/apps/client/ClientInfoSlice.js';
import {setUserType} from '../../src/store/apps/auth/UserTypeSlice.js';
import SkillLensChatbot from '../../src/components/chatbot/SkillLensChatbot.jsx';
import ApiUtils from '../../src/api/ApiUtils.jsx';

await new Promise(resolve => {
  if (persistor.getState().bootstrapped) return resolve();
  const unsubscribe = persistor.subscribe(() => {
    if (persistor.getState().bootstrapped) {unsubscribe(); resolve();}
  });
});
persistor.pause();
store.dispatch(setUserType('client'));
window.selectChatClient = clientId => store.dispatch(setClientInfo(
  clientId == null ? null : compressFflate(JSON.stringify({client_id: clientId})),
));
window.selectChatClient(null);
ApiUtils.setCookie('accessToken', 'synthetic-fixture');
createRoot(document.getElementById('chatbot-test-root')).render(
  <Provider store={store}><SkillLensChatbot /></Provider>,
);
