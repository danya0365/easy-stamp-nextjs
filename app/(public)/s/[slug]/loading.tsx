import { Card } from "@/src/presentation/components/ui/Card";
import { Skeleton } from "@/src/presentation/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8">
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </Card>
      <Card className="flex flex-col items-center gap-3">
        <Skeleton className="size-44 rounded-xl" />
        <Skeleton className="h-3 w-32" />
      </Card>
    </main>
  );
}
