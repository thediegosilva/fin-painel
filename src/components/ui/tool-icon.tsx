import {
  Combine,
  FileImage,
  FileInput,
  FileMinus,
  FileOutput,
  FileText,
  Hash,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LockOpen,
  Minimize2,
  RotateCw,
  Scissors,
  Signature,
  Stamp,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CategoryId, IconName } from "@/lib/tools";

const ICONS: Record<IconName, LucideIcon> = {
  combine: Combine,
  scissors: Scissors,
  "file-minus": FileMinus,
  "file-output": FileOutput,
  "layout-grid": LayoutGrid,
  "minimize-2": Minimize2,
  image: ImageIcon,
  "file-image": FileImage,
  "file-text": FileText,
  "file-input": FileInput,
  "rotate-cw": RotateCw,
  hash: Hash,
  stamp: Stamp,
  signature: Signature,
  lock: Lock,
  "lock-open": LockOpen,
  tags: Tags,
};

const SIZES = {
  sm: "size-8 rounded-lg [&>svg]:size-4",
  md: "size-11 rounded-xl [&>svg]:size-5",
  lg: "size-14 rounded-2xl [&>svg]:size-7",
};

export function ToolIcon({
  icon,
  category,
  size = "md",
  className,
}: {
  icon: IconName;
  category: CategoryId;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return (
    <span
      data-cat={category}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-[var(--cat-soft)] text-[var(--cat)]",
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      <Icon strokeWidth={2} />
    </span>
  );
}
