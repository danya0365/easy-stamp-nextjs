import { Card } from "@/src/presentation/components/ui/Card";
import { Skeleton } from "@/src/presentation/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-6 w-44" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Skeleton className="mx-auto aspect-square w-full max-w-xs rounded-xl" />
        <Skeleton className="mx-auto h-10 w-40 rounded-full" />
      </Card>
    </div>
  );
}
