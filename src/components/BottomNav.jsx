import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const tabs = [
    { path: '/', icon: '📅', label: 'TODAY' },
    { path: '/horizons', icon: '🎯', label: 'HORIZONS' },
    { path: '/backlog', icon: '📥', label: 'BACKLOG' },
    { path: '/stats', icon: '📊', label: 'STATS' },
    { path: '/setup', icon: '️', label: 'SETUP' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-800 flex justify-around items-center h-16 shadow-lg z-50">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors ${
              isActive ? 'text-blue-400 font-bold' : 'text-stone-500 hover:text-stone-300'
            }`
          }
        >
          <span className="text-xl mb-1">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}