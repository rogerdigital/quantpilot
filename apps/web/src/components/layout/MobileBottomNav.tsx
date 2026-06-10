import { NavLink } from 'react-router-dom';
import { copy, useLocale } from '../../modules/console/console.i18n.tsx';
import { listSidebarRoutes } from '../../modules/console/console.routes.tsx';
import { bottomNav, bottomNavItem, bottomNavItemActive } from './ConsoleChrome.css.ts';
import { NavIcon } from './NavIcons.tsx';

export function MobileBottomNav() {
  const { locale } = useLocale();
  const routes = listSidebarRoutes();

  return (
    <nav className={bottomNav}>
      {routes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `${bottomNavItem}${isActive ? ` ${bottomNavItemActive}` : ''}`
          }
        >
          <NavIcon id={route.id} size={18} color="currentColor" />
          <span>{copy[locale].nav[route.id]}</span>
        </NavLink>
      ))}
    </nav>
  );
}
