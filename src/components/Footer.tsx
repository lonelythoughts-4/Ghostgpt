import React from 'react';
import { Mail, Github, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-emerald-500/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">G</span>
              </div>
              <span className="text-emerald-400 font-bold">GhostGPT</span>
            </div>
            <p className="text-slate-400 text-sm">
              Premium AI access with secure payment verification.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-emerald-400 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-emerald-400 font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-500/20 pt-8">
          <p className="text-slate-500 text-sm text-center">
            (c) {currentYear} GhostGPT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
