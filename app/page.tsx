"use client";

import { useState, useEffect } from "react";
import { Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project/project-card";
import { DeleteProjectDialog } from "@/components/project/delete-project-dialog";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { Project } from "@/models/project";
import { sampleProjects } from "@/data/sample-projects";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for delete project dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // State for create project dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await fetch('/api/projects/all');
        // const data = await response.json();
        
        // Simulating API call with sample data
        setTimeout(() => {
          setProjects(sampleProjects);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, []);

  // Function to handle project deletion
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      // In a real app, this would be an API call
      // await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      
      // Update local state to remove the deleted project
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      
      // Close the dialog and reset state
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  // Function to handle project creation
  const handleCreateProject = (id: string, name: string) => {
    // Create a new project with minimal data
    const newProject: Project = {
      id,
      name,
      cameras: [],
      areas: []
    };
    
    // In a real app, this would be an API call
    // await fetch('/api/projects', { 
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newProject)
    // });
    
    // Update local state to include the new project
    setProjects([...projects, newProject]);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--tensora-dark)] mb-2">Projects</h2>
          <p className="text-gray-500">Select a project to view its crowd counting data</p>
        </div>
        {/* Prominent New Project button using Tensora dark color */}
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          size="lg"
          className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white font-medium shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" /> New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="p-6 pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Skeleton className="h-4 w-12 mb-1" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Skeleton className="h-4 w-12 mb-1" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1">Try refreshing the page or contact support if the issue persists.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="bg-[var(--tensora-light)]/5 border border-[var(--tensora-light)]/20 rounded-lg p-8 text-center">
          <Video className="h-12 w-12 mx-auto text-[var(--tensora-medium)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--tensora-dark)] mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first project.
          </p>
          {/* Empty state action button using Tensora dark color */}
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            size="lg"
            className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)] text-white font-medium shadow-md"
          >
            <Plus className="h-5 w-5 mr-2" /> Create Project
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <DeleteProjectDialog
          isOpen={deleteDialogOpen}
          projectName={projectToDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
          }}
        />
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </main>
  );
}