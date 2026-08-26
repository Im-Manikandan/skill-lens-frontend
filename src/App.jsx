// Imports
import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { useSelector } from 'react-redux';
import ThemeRoutes from './routes/Router';
import ThemeSelector from './layouts/theme/ThemeSelector';
import Loader from './layouts/loader/Loader';

// App Component
function App() {
  // Router and Theme Configuration
  const router = createBrowserRouter(ThemeRoutes, { basename: import.meta.env.BASE_URL });
  const direction = useSelector((state) => state.customizer.isRTL);
  return (
    <Suspense fallback={<Loader />}>
      <div
        className={`${direction ? 'rtl' : 'ltr'} dark`}
        dir={direction ? 'rtl' : 'ltr'}
      >
        <ThemeSelector />
        <RouterProvider
          router={router}
          fallbackElement={<Loader />}
        />
      </div>
    </Suspense>
  );
}

export default App;
