import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import Home from './src/pages/Home';
import AccessPage from './src/pages/AccessPage';
import SupportPage from './src/pages/SupportPage';
import TrialPage from './src/pages/TrialPage';
import NotFound from './src/pages/NotFound';

const App: React.FC = () => {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <div className="min-h-screen font-sans bg-slate-950">
        <BrowserRouter>
          <Routes>
            <Route element={<Home />}>
              <Route path="/" element={<AccessPage />} />
              <Route path="/access" element={<AccessPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/trial" element={<TrialPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </div>
    </Theme>
  );
};

export default App;
