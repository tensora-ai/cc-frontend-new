import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

export function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <Button 
      variant="outline" 
      className="w-full border-dashed border-[var(--tensora-medium)] text-[var(--tensora-medium)] hover:bg-[var(--tensora-light)]/10 h-12"
      onClick={onClick}
    >
      <Plus className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}