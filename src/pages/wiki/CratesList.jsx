import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { CRATES } from '../../data/items';
export default function CratesList() {
  return <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}><h1>Crates</h1><p className="crumb">WIKI / Crates</p><EntityGrid entities={CRATES} linkBase="/wiki/items/Crates" emptyLabel="No crates published yet." /></PageShell>;
}
