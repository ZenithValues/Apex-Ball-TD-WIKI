import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import HoloBackground from './components/HoloBackground';
import SmoothScroll from './components/SmoothScroll';
import AnimatedPage from './components/AnimatedPage';
import MobileBottomNav from './components/MobileBottomNav';
import ThemeEditor from './components/ThemeEditor';
import BackToTop from './components/BackToTop';
import ShortcutHelp from './components/ShortcutHelp';
import Home from './pages/Home';
import BallKnowledge from './pages/BallKnowledge';
import AdminHome from './pages/admin/AdminHome';
import Credits from './pages/Credits';

import WikiHome from './pages/wiki/WikiHome';
import UnitsList from './pages/wiki/UnitsList';
import UnitDetail from './pages/wiki/UnitDetail';
import UnitCompare from './pages/wiki/UnitCompare';
import WikiUnitSearch from './pages/wiki/UnitSearch';
import ItemsList from './pages/wiki/ItemsList';
import ItemDetail from './pages/wiki/ItemDetail';
import MapsList from './pages/wiki/MapsList';
import MapDetail from './pages/wiki/MapDetail';
import TraitsList from './pages/wiki/TraitsList';
import TraitDetail from './pages/wiki/TraitDetail';
import SkinsList from './pages/wiki/SkinsList';
import SkinDetail from './pages/wiki/SkinDetail';

import ValuesHome from './pages/values/ValuesHome';
import ValueUnitsList from './pages/values/ValueUnitsList';
import ValueUnitDetail from './pages/values/ValueUnitDetail';
import ValuesUnitSearch from './pages/values/UnitSearch';
import TradeCalculator from './pages/values/TradeCalculator';

function page(element, variant = 'default') {
  return <AnimatedPage variant={variant}>{element}</AnimatedPage>;
}

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
      } else if (key === 'w') {
        navigate('/wiki');
      } else if (key === 'v') {
        navigate('/values');
      } else if (key === 'c') {
        navigate('/values/calculator');
      } else if (key === 'b') {
        navigate('/ball-knowledge');
      } else if (key === 't') {
        setThemeOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [location.pathname, navigate]);

  return (
    <SmoothScroll>
      <HoloBackground />
      <Header onOpenTheme={() => setThemeOpen(true)} />
      <MobileBottomNav onOpenTheme={() => setThemeOpen(true)} />
      <ThemeEditor open={themeOpen} onClose={() => setThemeOpen(false)} />
      <ShortcutHelp open={shortcutOpen} onClose={() => setShortcutOpen(false)} />
      <BackToTop />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={page(<Home />)} />
          <Route path="/ball-knowledge" element={page(<BallKnowledge />)} />
          <Route path="/admin" element={page(<AdminHome />)} />
          <Route path="/admin/reset-password" element={page(<AdminHome />)} />
          <Route path="/credits" element={page(<Credits />)} />

          {/* WIKI */}
          <Route path="/wiki" element={page(<WikiHome />)} />
          <Route path="/wiki/compare" element={page(<UnitCompare />)} />
          <Route path="/wiki/units" element={<Navigate to="/wiki/units/Normie" replace />} />
          <Route path="/wiki/units/search" element={page(<WikiUnitSearch />)} />
          <Route path="/wiki/units/:rarity" element={page(<UnitsList />)} />
          <Route path="/wiki/units/:rarity/:slug" element={page(<UnitDetail />, 'detail')} />

          <Route path="/wiki/items" element={<Navigate to="/wiki/items/Consumables" replace />} />
          <Route path="/wiki/items/:group" element={page(<ItemsList />)} />
          <Route path="/wiki/items/:group/:slug" element={page(<ItemDetail />, 'detail')} />

          <Route path="/wiki/maps" element={page(<MapsList />)} />
          <Route path="/wiki/maps/:slug" element={page(<MapDetail />, 'detail')} />

          <Route path="/wiki/traits" element={page(<TraitsList />)} />
          <Route path="/wiki/traits/:slug" element={page(<TraitDetail />, 'detail')} />

          <Route path="/wiki/skins" element={<Navigate to="/wiki/skins/Normie" replace />} />
          <Route path="/wiki/skins/:category" element={page(<SkinsList shiny={false} />)} />
          <Route path="/wiki/skins/:category/:slug" element={page(<SkinDetail shiny={false} />, 'detail')} />

          <Route path="/wiki/shiny-skins" element={<Navigate to="/wiki/shiny-skins/Normie" replace />} />
          <Route path="/wiki/shiny-skins/:category" element={page(<SkinsList shiny={true} />)} />
          <Route path="/wiki/shiny-skins/:category/:slug" element={page(<SkinDetail shiny={true} />, 'detail')} />

          {/* VALUES */}
          <Route path="/values" element={page(<ValuesHome />)} />
          <Route path="/values/units" element={<Navigate to="/values/units/Normie" replace />} />
          <Route path="/values/units/search" element={page(<ValuesUnitSearch />)} />
          <Route path="/values/units/:rarity" element={page(<ValueUnitsList />)} />
          <Route path="/values/units/:rarity/:slug" element={page(<ValueUnitDetail />, 'detail')} />
          <Route path="/values/calculator" element={page(<TradeCalculator />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </SmoothScroll>
  );
}
