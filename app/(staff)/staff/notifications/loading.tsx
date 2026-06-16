import { ListCardSkeleton } from "@/src/presentation/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <ListCardSkeleton rows={6} />
    </div>
  );
}
