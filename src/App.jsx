import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HoloBackground from './components/HoloBackground';
import SmoothScroll from './components/SmoothScroll';
import Home from './pages/Home';

import WikiHome from './pages/wiki/WikiHome';
import UnitsList from './pages/wiki/UnitsList';
import UnitDetail from './pages/wiki/UnitDetail';
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
import TradeCalculator from './pages/values/TradeCalculator';

export default function App() {
  return (
    <SmoothScroll>
      <HoloBackground />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* WIKI */}
        <Route path="/wiki" element={<WikiHome />} />
        <Route path="/wiki/units" element={<Navigate to="/wiki/units/Normie" replace />} />
        <Route path="/wiki/units/:rarity" element={<UnitsList />} />
        <Route path="/wiki/units/:rarity/:slug" element={<UnitDetail />} />

        <Route path="/wiki/items" element={<Navigate to="/wiki/items/Consumables" replace />} />
        <Route path="/wiki/items/:group" element={<ItemsList />} />
        <Route path="/wiki/items/:group/:slug" element={<ItemDetail />} />

        <Route path="/wiki/maps" element={<MapsList />} />
        <Route path="/wiki/maps/:slug" element={<MapDetail />} />

        <Route path="/wiki/traits" element={<TraitsList />} />
        <Route path="/wiki/traits/:slug" element={<TraitDetail />} />

        <Route path="/wiki/skins" element={<Navigate to="/wiki/skins/Normie" replace />} />
        <Route path="/wiki/skins/:category" element={<SkinsList shiny={false} />} />
        <Route path="/wiki/skins/:category/:slug" element={<SkinDetail shiny={false} />} />

        <Route path="/wiki/shiny-skins" element={<Navigate to="/wiki/shiny-skins/Normie" replace />} />
        <Route path="/wiki/shiny-skins/:category" element={<SkinsList shiny={true} />} />
        <Route path="/wiki/shiny-skins/:category/:slug" element={<SkinDetail shiny={true} />} />

        {/* VALUES */}
        <Route path="/values" element={<ValuesHome />} />
        <Route path="/values/units" element={<Navigate to="/values/units/Normie" replace />} />
        <Route path="/values/units/:rarity" element={<ValueUnitsList />} />
        <Route path="/values/units/:rarity/:slug" element={<ValueUnitDetail />} />
        <Route path="/values/calculator" element={<TradeCalculator />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SmoothScroll>
  );
}
