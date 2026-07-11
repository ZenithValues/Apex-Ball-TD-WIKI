import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import HoloBackground from './components/HoloBackground';
import SmoothScroll from './components/SmoothScroll';
import AnimatedPage from './components/AnimatedPage';
import Home from './pages/Home';

import WikiHome from './pages/wiki/WikiHome';
import UnitsList from './pages/wiki/UnitsList';
import UnitDetail from './pages/wiki/UnitDetail';
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

// Wraps a page element with the "grow from the middle" transition. `detail`
// pages (individual unit pages) use a slightly stronger scale-up so the
// opening-from-center effect reads clearly when you click into a unit card.
function page(element, variant = 'default') {
  return <AnimatedPage variant={variant}>{element}</AnimatedPage>;
}

export default function App() {
  const location = useLocation();

  return (
    <SmoothScroll>
      <HoloBackground />
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={page(<Home />)} />

          {/* WIKI */}
          <Route path="/wiki" element={page(<WikiHome />)} />
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
