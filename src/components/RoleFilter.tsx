import { Button } from "@/components/ui/button";

interface FilterOption {
  value: string;
  label: string;
}

interface RoleFilterProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function RoleFilter({ options, value, onChange }: RoleFilterProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "default" : "secondary"}
          size="sm"
          className="text-xs"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
