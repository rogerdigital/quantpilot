import { useState } from 'react';
import { AppProviders } from './providers/AppProviders.tsx';
import { AppRouter } from './routes/AppRouter.tsx';
import { OnboardingWizard, isOnboardingComplete } from '../components/onboarding/OnboardingWizard.tsx';
import { useLocale } from '../modules/console/console.i18n.tsx';

function AppContent() {
  const { locale } = useLocale();
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());

  return (
    <>
      <AppRouter />
      {showOnboarding && (
        <OnboardingWizard
          locale={locale}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
