import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-gray-100 p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            value === item.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-sub",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}