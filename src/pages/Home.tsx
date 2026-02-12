import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  const location = useLocation();
  const currentPage =
    location.pathname === '/support'
      ? 'support'
      : location.pathname === '/trial'
        ? 'trial'
        : 'access';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header currentPage={currentPage} />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
