import { PageLoadingSkeleton } from "@/components/shared/loading-spinner";
import { PageContainer } from "@/components/layout/page-container";

export default function CertificacionesLoading() {
  return (
    <PageContainer>
      <PageLoadingSkeleton />
    </PageContainer>
  );
}
