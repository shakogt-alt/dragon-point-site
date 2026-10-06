import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import { Header } from './Header';
import { Footer } from './Footer';
import { Hero } from '@/components/sections/Hero';
import { GoalSelector } from '@/components/sections/GoalSelector';
import { BetterDecisions } from '@/components/sections/BetterDecisions';
import { DragonPointStandard } from '@/components/sections/DragonPointStandard';
import { Services } from '@/components/sections/Services';
import { Technology } from '@/components/sections/Technology';
import { LeadSection } from '@/components/sections/LeadSection';
import { MobileLeadCTA } from '@/components/leads/MobileLeadCTA';

export function Landing({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <>
      <a className="dp-skip-link" href="#main">
        {messages.skipLink}
      </a>
      <Header
        locale={locale}
        messages={{
          brand: messages.brand,
          languageNavigation: messages.languageNavigation,
          languageLabels: messages.languageLabels,
          landing: { header: messages.landing.header },
        }}
      />
      <main id="main" tabIndex={-1}>
        <Hero messages={messages} />
        <GoalSelector copy={messages.landing.goals} />
        <BetterDecisions copy={messages.landing.decisions} />
        <DragonPointStandard copy={messages.landing.standard} />
        <Services copy={messages.landing.services} />
        <Technology messages={messages} />
        <LeadSection locale={locale} copy={messages.landing.lead} />
      </main>
      <Footer locale={locale} messages={messages} />
      <MobileLeadCTA label={messages.landing.lead.submit} />
    </>
  );
}
