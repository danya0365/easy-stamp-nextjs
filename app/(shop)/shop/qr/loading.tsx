import { Card } from "@/src/presentation/components/ui/Card";
import { Skeleton } from "@/src/presentation/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card className="flex flex-col items-center gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="size-56 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-full" />
      </Card>
    </div>
  );
}
