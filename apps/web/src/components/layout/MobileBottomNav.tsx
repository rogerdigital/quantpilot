import { NavLink } from 'react-router-dom';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import { listSidebarRoutes } from '../../modules/console/console.routes.tsx';
import { bottomNav, bottomNavItem, bottomNavItemActive } from './ConsoleChrome.css.ts';

export function MobileBottomNav() {
  const { locale } = useLocale();
  const routes = listSidebarRoutes();

  // Show first 5 routes in bottom nav
  const visibleRoutes = routes.slice(0, 5);

  return (
    <nav className={bottomNav}>
      {visibleRoutes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `${bottomNavItem}${isActive ? ` ${bottomNavItemActive}` : ''}`
          }
        >
          <span style={{ fontSize: '16px' }}>{getIcon(route.id)}</span>
          <span>{copy[locale].nav[route.id]}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function getIcon(id: string): string {
  const icons: Record<string, string> = {
    overview: '◈',
    market: '◉',
    strategies: '◇',
    backtest: '⟐',
    execution: '⬡',
    risk: '△',
    agent: '◎',
    notifications: '⊡',
    settings: '⚙',
  };
  return icons[id] ?? '•';
}
