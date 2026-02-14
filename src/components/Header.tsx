import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/80 border-b border-emerald-500/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">G</span>
            </div>
            <span className="text-emerald-400 font-bold text-lg hidden sm:inline">GhostGPT</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                currentPage === 'access'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              Access
            </Link>
            <Link
              to="/support"
              className={`text-sm font-medium transition-colors ${
                currentPage === 'support'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              Support
            </Link>
            <Link
              to="/trial"
              className={`text-sm font-medium transition-colors ${
                currentPage === 'trial'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              Free Trial
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-emerald-500/20 pt-4 space-y-2">
            <Link
              to="/"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'access'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              } hover:bg-slate-800`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Access
            </Link>
            <Link
              to="/support"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'support'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              } hover:bg-slate-800`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Support
            </Link>
            <Link
              to="/trial"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'trial'
                  ? 'text-emerald-400'
                  : 'text-slate-300 hover:text-emerald-400'
              } hover:bg-slate-800`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Free Trial
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
