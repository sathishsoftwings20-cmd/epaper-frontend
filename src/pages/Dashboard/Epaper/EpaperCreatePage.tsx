// src/pages/Admin/EpaperCreatePage.tsx
import PageMeta from "../../../components/common/PageMeta";
import EpaperForm from "../../../components/epaper/EpaperForm";

export default function EpaperCreatePage() {
  return (
    <>
      <PageMeta
        title="Upload ePaper | Epaper Admin"
        description="Upload new digital newspaper edition"
      />
      <div className="space-y-6">
        <EpaperForm />
      </div>
    </>
  );
}
