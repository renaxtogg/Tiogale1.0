import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
