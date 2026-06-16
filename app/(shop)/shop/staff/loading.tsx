import {
  FormCardSkeleton,
  ListCardSkeleton,
} from "@/src/presentation/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <FormCardSkeleton fields={3} />
      <ListCardSkeleton rows={4} />
    </div>
  );
}
