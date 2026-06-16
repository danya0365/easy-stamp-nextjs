import { Card } from "@/src/presentation/components/ui/Card";
import { Skeleton } from "@/src/presentation/components/ui/Skeleton";
import { StatsSkeleton } from "@/src/presentation/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-32" />
      <StatsSkeleton count={6} />
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-60 w-full" />
      </Card>
    </div>
  );
}
