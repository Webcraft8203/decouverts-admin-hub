import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryPills({ categories, selectedId, onSelect }: Props) {
  const items = [{ id: "all", name: "All" }, ...categories];

  return (
    <div className="border-b border-border/60 bg-background sticky top-16 z-30 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4">
          {items.map((cat) => {
            const active =
              cat.id === "all" ? selectedId === null : selectedId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id === "all" ? null : cat.id)}
                className={`relative shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="category-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
