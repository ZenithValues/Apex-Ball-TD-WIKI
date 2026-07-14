import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import HoloBackground from './components/HoloBackground';
import SmoothScroll from './components/SmoothScroll';
import MobileBottomNav from './components/MobileBottomNav';
import ThemeEditor from './components/ThemeEditor';
import BackToTop from './components/BackToTop';
import ShortcutHelp from './components/ShortcutHelp';
import RouteEffects from './components/RouteEffects';
import AppRoutes from './AppRoutes';
import { SHORTCUT_ROUTES } from './config/navigation';

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [themeOpen, setThemeOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setThemeOpen(false);
        setShortcutOpen(false);
        return;
      }

      if (event.key === '?' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setShortcutOpen((open) => !open);
        return;
      }

      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === '/') {
        event.preventDefault();
        navigate(location.pathname.startsWith('/values') ? '/values/units/search' : '/wiki/units/search');
      } else if (key === 't') {
        setThemeOpen(true);
      } else if (SHORTCUT_ROUTES[key]) {
        navigate(SHORTCUT_ROUTES[key]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [location.pathname, navigate]);

  return (
    <SmoothScroll>
      <RouteEffects />
      <HoloBackground />
      <Header onOpenTheme={() => setThemeOpen(true)} />
      <MobileBottomNav onOpenTheme={() => setThemeOpen(true)} />
      <ThemeEditor open={themeOpen} onClose={() => setThemeOpen(false)} />
      <ShortcutHelp open={shortcutOpen} onClose={() => setShortcutOpen(false)} />
      <BackToTop />
      <AppRoutes />
    </SmoothScroll>
  );
}
