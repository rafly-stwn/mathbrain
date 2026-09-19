import { NavLink, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Sembunyikan bottom navigation saat sedang di dalam arena duel atau sedang bermain teka-teki
  if (location.pathname === '/duel/arena' || location.pathname.startsWith('/game/')) {
    return null;
  }

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-card rounded-t-card z-50 px-6 py-3 border-t border-lavender/10">
      <ul className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <li key={item.path} className="flex-1 flex justify-center">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 transition-colors relative ${
                  isActive ? 'text-lavender' : 'text-warmgray'
                }`
              }
              end={item.path === '/'}
            >
              {({ isActive }) => (
                <>
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-lavender rounded-full mt-1 absolute -bottom-1" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

