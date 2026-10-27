import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** 서버에서 데이터를 못 불러왔을 때 */
export function LoadError({
  error,
  onRetry,
  title = "정보를 불러오지 못했어요",
}: {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <EmptyState
      icon={CloudOff}
      title={title}
      description={error?.message ?? "잠시 후 다시 시도해 주세요."}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" />
            다시 불러오기
          </Button>
        )
      }
    />
  );
}