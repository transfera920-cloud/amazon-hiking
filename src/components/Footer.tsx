import React from 'react';

interface FooterProps {
  lineUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({ lineUrl = "https://lin.ee/TJJLV36" }) => {
  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-950 py-5 sm:py-6 text-center text-xs sm:text-sm text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 font-medium">
          <span>亞馬遜國家山岳協會</span>
          <span className="text-neutral-600">｜</span>
          <a
            id="footer-line-consult-link"
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 transition-colors underline decoration-emerald-600/50 hover:decoration-emerald-400 underline-offset-4"
          >
            LINE 官方諮詢
          </a>
        </div>
      </div>
    </footer>
  );
};
