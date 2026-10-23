import React, { useEffect } from 'react';

export default function PrivacyPage({ initialSection }) {
  useEffect(() => {
    if (initialSection === 'cookies') document.getElementById('cookies')?.scrollIntoView();
  }, [initialSection]);

  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="privacy-page">
      <article className="max-w-3xl mx-auto bg-white/80 border border-white p-8 md:p-10">
        <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#0A7A6A]">// Legal</p>
        <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tighter text-[#1A2A3C] mb-3">Privacy & Cookie Policy</h1>
        <p className="text-xs text-[#667085] mb-8">Last updated: August 31, 2026</p>
        <div className="space-y-7 text-sm leading-relaxed text-[#4A5A70]">
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Information we collect</h2><p>We collect information you provide, such as your name, email address, profile details, posts, comments, newsletter preferences, and messages. We also receive basic technical data such as IP address, browser type, device information, referring pages, and activity on the site.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">How we use information</h2><p>We use information to provide and secure accounts, publish community contributions, moderate content, deliver requested emails, respond to you, prevent fraud, measure site performance, and comply with legal obligations. We do not sell your personal information.</p></section>
          <section id="cookies" className="scroll-mt-24"><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Cookies and advertising</h2><p>Essential browser storage remembers security and consent choices. With your permission, Google Analytics may measure visits and Google AdSense may store or access cookies to deliver, measure, and personalize ads. Google and its partners may use data from your visit in accordance with <a className="underline text-[#0A7A6A]" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">Google’s partner-sites policy</a>. You can decline optional storage in our banner and manage ads through <a className="underline text-[#0A7A6A]" href="https://myadcenter.google.com/" target="_blank" rel="noreferrer">Google My Ad Center</a>.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Sharing and retention</h2><p>We share information only with service providers that help operate the site, advertising and analytics partners when permitted, authorities when legally required, or a successor in a business transaction. Public posts and profile information are visible to others. We retain data only as long as needed for these purposes, legal requirements, and dispute resolution.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Your choices and rights</h2><p>You may update account information, unsubscribe from marketing emails, decline optional cookies, or request access, correction, deletion, or restriction of personal information. Depending on where you live, additional privacy rights may apply. We will not discriminate against you for exercising them.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Children, security, and transfers</h2><p>The service is not directed to children under 13. We use reasonable safeguards, but no online system is completely secure. Because the site serves a global community, information may be processed outside your region with protections required by applicable law.</p></section>
          <section><h2 className="font-heading font-bold text-xl text-[#1A2A3C] mb-2">Contact us</h2><p>For privacy questions or requests, email privacy@blogs4blocks.com. We may update this policy and will show the latest revision date above.</p></section>
        </div>
      </article>
    </div>
  );
}
