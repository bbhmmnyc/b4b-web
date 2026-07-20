import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="terms-page">
      <div className="max-w-3xl mx-auto bg-white/80 border border-white p-8 md:p-10">
        <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#0A7A6A]">// Legal</p>
        <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter text-[#1A2A3C] mb-6">
          Terms & Conditions
        </h1>
        <p className="text-sm leading-relaxed text-[#4A5A70] mb-5">
          This page is a placeholder for the official Blogs 4 Blocks Terms & Conditions.
        </p>
        <p className="text-sm leading-relaxed text-[#4A5A70] mb-5">
          Community participation should be honest, local or regionally grounded where relevant, respectful, and free from spam, misleading claims, or harmful conduct. Posts, comments, links, accounts, and uploaded materials may be removed if they violate site standards.
        </p>
        <p className="text-sm leading-relaxed text-[#4A5A70]">
          A fuller legal version can be added before final launch with details covering acceptable use, content ownership, moderation rights, advertising, donations, privacy, and account removal.
        </p>
      </div>
    </div>
  );
}
