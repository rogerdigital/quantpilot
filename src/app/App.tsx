import { AppProviders } from './providers/AppProviders.tsx';
import { AppRouter } from './routes/AppRouter.tsx';

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
