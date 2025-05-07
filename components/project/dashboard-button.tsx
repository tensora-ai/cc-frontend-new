import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardButtonProps {
  onClick?: () => void;
}

export function DashboardButton({ onClick }: DashboardButtonProps) {
  return (
    <Button 
      size="lg" 
      className="w-full sm:w-auto bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white font-medium text-lg shadow-md h-16"
      onClick={onClick}
    >
      Open Project Dashboard
      <ExternalLink className="ml-2 h-5 w-5" />
    </Button>
  );
}