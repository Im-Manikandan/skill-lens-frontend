// Imports
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/es/storage';

// Slice Reducer Imports
import CustomizerReducer from './customizer/CustomizerSlice';
import AuthReducer from './apps/auth/AuthSlice';
import UserInfoReducer from './apps/auth/UserInfoSlice';
import UserTypeReducer from './apps/auth/UserTypeSlice';
import ClientInfoReducer from './apps/client/ClientInfoSlice';

// Persistence Configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'customizer', 'userInfo', 'userType', 'clientInfo'],
};

// Root Reducer
const rootReducer = combineReducers({
  customizer: CustomizerReducer,
  auth: AuthReducer,
  userInfo: UserInfoReducer,
  userType: UserTypeReducer,
  clientInfo: ClientInfoReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store Configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
