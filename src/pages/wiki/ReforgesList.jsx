import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { REFORGES } from '../../data/reforges';

// Editors can replace these starter records through the shared content store.
export default function ReforgesList() {
  return <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}><h1>Reforges</h1><p className="crumb">WIKI / Reforges</p><EntityGrid entities={REFORGES} linkBase="/wiki/reforges" emptyLabel="No reforges published yet." /></PageShell>;
}
