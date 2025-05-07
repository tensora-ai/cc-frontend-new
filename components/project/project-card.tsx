import Link from "next/link";
import { Camera, Map, ArrowRight, Trash2 } from "lucide-react";
import { Project } from "@/models/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectCardProps {
  project: Project;
  onDeleteClick: (project: Project) => void;
}

export function ProjectCard({ project, onDeleteClick }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden border-t-4 border-t-[var(--tensora-medium)] hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-[var(--tensora-dark)]">{project.name}</CardTitle>
            <CardDescription>Project ID: {project.id}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDeleteClick(project)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
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
      </CardContent>
      <CardFooter>
        <Link href={`/project/${project.id}`} className="w-full">
          <Button 
            className="w-full bg-[var(--tensora-medium)] hover:bg-[var(--tensora-dark)] text-white" 
            variant="default"
          >
            View Project <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}