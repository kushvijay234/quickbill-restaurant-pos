import React from 'react';
import FastBilloLogo from './common/FastBilloLogo';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-5 border-t border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm transition-colors duration-200 no-print">
      <div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FastBilloLogo size={22} showBrandText={false} />
          <span className="font-black text-gray-900 dark:text-white tracking-tight">
            FAST<span className="text-emerald-600 dark:text-emerald-400">BILLO</span>
          </span>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Bill Fast. Grow Faster.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 text-center sm:text-right">
          <span className="text-gray-500 dark:text-gray-400">Powered by</span>
          <a
            href="https://vjenterprisesdigitalsolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1 hover:underline"
            title="VJ Enterprises Digital Solutions"
          >
            <span>VJ ENTERPRISES DIGITAL SOLUTIONS</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <span className="hidden sm:inline text-gray-400 dark:text-gray-500">•</span>
          <span className="text-gray-600 dark:text-gray-300 italic font-medium">
            "Grow Digitally, Grow Confidently"
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
