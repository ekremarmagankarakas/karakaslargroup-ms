import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/common/PageHeader';
import { FavoritesSection } from '../../components/procurement/favorites/FavoritesSection';

export function FavoritesPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Favorilerim" />
      <FavoritesSection />
    </DashboardLayout>
  );
}
