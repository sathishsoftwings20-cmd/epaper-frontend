// src/pages/Admin/EpaperListPage.tsx
import PageMeta from "../../../components/common/PageMeta";
import EpaperList from "../../../components/epaper/EpaperList";

export default function EpaperListPage() {
  return (
    <>
      <PageMeta
        title="ePaper Management | Epaper Admin"
        description="Manage digital newspaper editions"
      />
      <div className="space-y-6">
        <EpaperList />
      </div>
    </>
  );
}
