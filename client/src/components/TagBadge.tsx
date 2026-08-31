import type { Tag } from "../api";

const CATEGORY_STYLES: Record<Tag["category"], string> = {
  TROPE: "bg-sandy/20 text-paprika",
  WARNING: "bg-paprika/10 text-paprika",
  SPICE: "bg-royal/15 text-royal",
  OTHER: "bg-lime/60 text-ink",
};

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_STYLES[tag.category]}`}>
      {tag.name}
    </span>
  );
}
