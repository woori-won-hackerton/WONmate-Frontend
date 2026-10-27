import { Suspense } from "react";
import { PrepWorkspace } from "@/components/prep/PrepWorkspace";
import { LoadingBlock } from "@/components/ui/Skeleton";

export default function PrepPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PrepWorkspace />
    </Suspense>
  );
}
