import { Card } from "@/src/presentation/components/ui/Card";
import { Skeleton } from "@/src/presentation/components/ui/Skeleton";
import { FormCardSkeleton } from "@/src/presentation/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <FormCardSkeleton fields={1} />
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </Card>
    </div>
  );
}
