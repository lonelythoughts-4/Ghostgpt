import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-emerald-400" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-emerald-400 mb-4">404</h1>
        <p className="text-slate-300 text-lg mb-8">Page not found</p>
        <Link
          to="/"
          className="inline-block bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold px-6 py-3 rounded-lg transition-all duration-200"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
