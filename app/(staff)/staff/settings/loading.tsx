import { FormCardSkeleton } from "@/src/presentation/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <FormCardSkeleton fields={3} />
      <FormCardSkeleton fields={3} />
    </div>
  );
}
