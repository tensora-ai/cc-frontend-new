import Link from "next/link";
import { Camera, Map, ArrowRight, Trash2, BarChart3 } from "lucide-react";
import { Project } from "@/models/project";
import { UserRole } from "@/models/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectCardProps {
  project: Project;
  onDeleteClick: (project: Project) => void;
  showDeleteButton: boolean;
  userRole?: UserRole;
}

export function ProjectCard({ 
  project, 
  onDeleteClick, 
  showDeleteButton,
  userRole 
}: ProjectCardProps) {
  
  // Determine the primary action based on user role
  const getPrimaryAction = () => {
    if (userRole === UserRole.PROJECT_OPERATOR) {
      // PROJECT_OPERATOR goes directly to dashboard
      return {
        href: `/project/${project.id}/dashboard`,
        label: "View Dashboard",
        icon: <BarChart3 className="h-4 w-4 ml-2" />
      };
    } else {
      // SUPER_ADMIN and PROJECT_ADMIN go to project settings
      return {
        href: `/project/${project.id}`,
        label: "View Project",
        icon: <ArrowRight className="h-4 w-4 ml-2" />
      };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <Card className="overflow-hidden border-t-4 border-t-[var(--tensora-medium)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-[var(--tensora-dark)]">{project.name}</CardTitle>
            <CardDescription>Project ID: {project.id}</CardDescription>
          </div>
          {showDeleteButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeleteClick(project)}
              title="Delete Project"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--tensora-light)]/10 p-4 rounded-lg text-center">
            <p className="text-gray-500 text-sm flex items-center justify-center mb-1">
              <Camera className="h-4 w-4 mr-1 text-[var(--tensora-medium)]" /> Cameras
            </p>
            <p className="text-2xl font-bold text-[var(--tensora-dark)]">{project.cameras.length}</p>
          </div>
          <div className="bg-[var(--tensora-light)]/10 p-4 rounded-lg text-center">
            <p className="text-gray-500 text-sm flex items-center justify-center mb-1">
              <Map className="h-4 w-4 mr-1 text-[var(--tensora-medium)]" /> Areas
            </p>
            <p className="text-2xl font-bold text-[var(--tensora-dark)]">{project.areas.length}</p>
          </div>
        </div>
        
        {/* Show additional dashboard link for SUPER_ADMIN and PROJECT_ADMIN */}
        {userRole !== UserRole.PROJECT_OPERATOR && (
          <div className="mt-4">
            <Link href={`/project/${project.id}/dashboard`}>
              <Button 
                variant="outline" 
                className="w-full text-[var(--tensora-medium)] border-[var(--tensora-medium)] hover:bg-[var(--tensora-light)]/10"
              >
                <BarChart3 className="h-4 w-4 mr-2" /> Open Dashboard
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={primaryAction.href} className="w-full">
          <Button 
            className="w-full bg-[var(--tensora-medium)] hover:bg-[var(--tensora-dark)] text-white" 
            variant="default"
          >
            {primaryAction.label} {primaryAction.icon}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}