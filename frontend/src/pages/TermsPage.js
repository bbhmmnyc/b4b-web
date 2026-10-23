import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="terms-page">
      <div className="max-w-3xl mx-auto bg-white/80 border border-white p-8 md:p-10">
        <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#0A7A6A]">// Legal</p>
        <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter text-[#1A2A3C] mb-6">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#667085] mb-8">Last updated: August 31, 2026</p>
        <div className="space-y-7 text-sm leading-relaxed text-[#4A5A70]">
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Using Blogs 4 Blocks</h2><p>By accessing this site, you agree to use it lawfully and respectfully. You may not post spam, malware, deceptive claims, harassment, unlawful material, or content that infringes another person’s rights. You must be at least 13 years old to create an account.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Community content</h2><p>You retain ownership of content you submit. You grant Blogs 4 Blocks a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and distribute that content as needed to operate and promote the service. You are responsible for having the rights to anything you submit.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Moderation and accounts</h2><p>We may review, edit, restrict, or remove content and suspend accounts to protect the community, comply with law, or enforce these terms. You may request account deletion by emailing privacy@blogs4blocks.com.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Advertising and third parties</h2><p>The site may display advertising and link to third-party services. Those services have their own terms and privacy practices. Advertising, donations, or sponsored content do not create an endorsement unless we explicitly say otherwise.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Disclaimers and liability</h2><p>Community posts are the authors’ opinions and are provided for general information, not professional advice. The service is provided “as is” without warranties to the extent permitted by law. Blogs 4 Blocks is not liable for indirect or consequential losses arising from use of the site.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Changes and contact</h2><p>We may update these terms and will post the revised date here. Continued use after an update means you accept the revised terms. Questions may be sent to legal@blogs4blocks.com.</p></section>
        </div>
      </div>
    </div>
  );
}
