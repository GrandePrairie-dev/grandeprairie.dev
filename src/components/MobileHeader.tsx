import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex items-center p-2 border-b border-border shrink-0 md:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
