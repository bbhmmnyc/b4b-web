import React from 'react';
import { Briefcase, Mail } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="careers-page">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 border border-white p-8 md:p-10">
          <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-full bg-[#1A4A8A]/10 text-[#1A4A8A]">
            <Briefcase className="w-6 h-6" />
          </div>
          <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#1A4A8A]">// Careers</p>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter text-[#1A2A3C] mb-5">
            Marketing career resources are coming soon.
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-[#4A5A70] mb-6">
            This section will begin as an admin-managed resource area for useful marketing roles, companies, and career links. That keeps it curated before opening up any broader submission flow.
          </p>
          <div className="flex items-start gap-3 border border-[#D8E2F0] bg-[#F8FAFC] p-4 text-sm text-[#1A2A3C]">
            <Mail className="w-5 h-5 flex-shrink-0 text-[#1A4A8A]" />
            <p>If a company or resource should be considered later, it can be reviewed by admin before anything is published.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
