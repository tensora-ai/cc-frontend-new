"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X, Save, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Edge } from "@/models/project";

interface MaskingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (edges: Edge[]) => void;
  initialEdges?: Edge[];
  resolution: [number, number];
}

export function MaskingEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  initialEdges = [],
  resolution
}: MaskingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ 
    width: 600, 
    height: 400 
  });

  // When the component mounts or resolution changes, calculate canvas size
  useEffect(() => {
    const containerWidth = 600; // Maximum width of the canvas container
    
    // Calculate the aspect ratio
    const aspectRatio = resolution[0] / resolution[1];
    
    // Calculate the dimensions while maintaining aspect ratio
    let width = containerWidth;
    let height = containerWidth / aspectRatio;
    
    // If height is too large, recalculate
    if (height > 400) {
      height = 400;
      width = height * aspectRatio;
    }
    
    setCanvasSize({ width, height });
  }, [resolution]);

  // Initialize with initial edges
  useEffect(() => {
    if (initialEdges && initialEdges.length > 0) {
      setEdges(initialEdges);
    } else {
      // If no initial edges, create a default rectangle covering the whole frame
      setEdges([
        [0, 0],
        [0, resolution[1]],
        [resolution[0], resolution[1]],
        [resolution[0], 0]
      ]);
    }
  }, [initialEdges, resolution]);

  // Redraw the canvas when edges change
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale factors
    const scaleX = canvas.width / resolution[0];
    const scaleY = canvas.height / resolution[1];
    
    // Draw a grid background to visualize the area
    const gridSize = 50; // Grid size in original resolution
    const scaledGridSizeX = gridSize * scaleX;
    const scaledGridSizeY = gridSize * scaleY;
    
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += scaledGridSizeX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += scaledGridSizeY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw border for the camera viewport
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw the polygon
    if (edges.length > 0) {
      ctx.beginPath();
      
      // Scale the first point
      const startX = edges[0][0] * scaleX;
      const startY = edges[0][1] * scaleY;
      
      ctx.moveTo(startX, startY);
      
      // Draw lines to each point
      for (let i = 1; i < edges.length; i++) {
        const x = edges[i][0] * scaleX;
        const y = edges[i][1] * scaleY;
        ctx.lineTo(x, y);
      }
      
      // Close the path
      ctx.lineTo(startX, startY);
      
      // Set styles and draw
      ctx.fillStyle = "rgba(91, 94, 150, 0.3)"; // Tensora medium purple with transparency
      ctx.strokeStyle = "rgba(29, 27, 68, 0.8)"; // Tensora dark purple with transparency
      ctx.lineWidth = 2;
      
      ctx.fill();
      ctx.stroke();
      
      // Draw vertices
      edges.forEach((point, index) => {
        const x = point[0] * scaleX;
        const y = point[1] * scaleY;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = index === dragIndex 
          ? "rgba(29, 27, 68, 1)" // Highlighted point (dark purple)
          : "rgba(91, 94, 150, 0.8)"; // Regular point (medium purple)
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [edges, dragIndex, canvasSize, resolution, isOpen]);

  // Convert canvas coordinates to original resolution coordinates
  const canvasToOriginalCoords = (
    canvasX: number, 
    canvasY: number
  ): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    
    const canvas = canvasRef.current;
    const scaleX = resolution[0] / canvas.width;
    const scaleY = resolution[1] / canvas.height;
    
    return [
      Math.round(canvasX * scaleX),
      Math.round(canvasY * scaleY)
    ];
  };
  
  // Find if we're clicking near a vertex (for dragging)
  const findNearbyVertex = (
    canvasX: number, 
    canvasY: number
  ): number | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const scaleX = canvas.width / resolution[0];
    const scaleY = canvas.height / resolution[1];
    
    // Check each vertex
    for (let i = 0; i < edges.length; i++) {
      const vertexX = edges[i][0] * scaleX;
      const vertexY = edges[i][1] * scaleY;
      
      // Calculate distance to vertex
      const distance = Math.sqrt(
        Math.pow(vertexX - canvasX, 2) + 
        Math.pow(vertexY - canvasY, 2)
      );
      
      // If within 10 pixels, consider it a hit
      if (distance <= 10) {
        return i;
      }
    }
    
    return null;
  };

  // Handle mouse down on canvas (to start dragging vertices)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position in canvas coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if we're clicking on an existing vertex
    const vertexIndex = findNearbyVertex(x, y);
    
    if (vertexIndex !== null) {
      // Start dragging this vertex
      setDragIndex(vertexIndex);
    } else {
      // Calculate position in original resolution
      const [originalX, originalY] = canvasToOriginalCoords(x, y);
      
      // Add a new point
      setEdges([...edges, [originalX, originalY]]);
    }
  };
  
  // Handle mouse move (for dragging vertices)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragIndex === null || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position in canvas coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to original resolution
    const [originalX, originalY] = canvasToOriginalCoords(x, y);
    
    // Update the dragged vertex
    const newEdges = [...edges];
    newEdges[dragIndex] = [originalX, originalY];
    setEdges(newEdges);
  };
  
  // Handle mouse up (to end dragging)
  const handleMouseUp = () => {
    setDragIndex(null);
  };
  
  // Handle mouse leave (to end dragging if mouse leaves canvas)
  const handleMouseLeave = () => {
    setDragIndex(null);
  };

  // Handle deleting a vertex
  const handleDeleteVertex = (index: number) => {
    // Ensure we keep at least 3 vertices for a valid polygon
    if (edges.length <= 3) {
      return;
    }
    
    const newEdges = [...edges];
    newEdges.splice(index, 1);
    setEdges(newEdges);
  };

  // Handle right-click to delete vertex
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position in canvas coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if we're clicking on an existing vertex
    const vertexIndex = findNearbyVertex(x, y);
    
    if (vertexIndex !== null) {
      handleDeleteVertex(vertexIndex);
    }
  };

  // Handle reset to default rectangle
  const handleResetToDefault = () => {
    setEdges([
      [0, 0],
      [0, resolution[1]],
      [resolution[0], resolution[1]],
      [resolution[0], 0]
    ]);
  };

  // Handle clear all points
  const handleClearPoints = () => {
    setEdges([]);
  };

  // Handle save
  const handleSave = () => {
    // Ensure we have at least 3 points for a valid polygon
    if (edges.length < 3) {
      alert("Please add at least 3 points to create a valid masking area");
      return;
    }
    
    onSave(edges);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--tensora-dark)]">Edit Masking Area</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Instructions:</strong> Click on the image to add points for the masking area.
          </p>
          <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
            <li>Click anywhere to add a new point</li>
            <li>Drag existing points to reposition them</li>
            <li>Right-click on a point to delete it</li>
            <li>The masked area (inside the polygon) will be used for counting</li>
          </ul>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <Pencil className="h-3 w-3" />
            <span>Camera resolution: {resolution[0]} × {resolution[1]} pixels</span>
          </div>
        </div>
        
        <div className="flex justify-center mb-6">
          <div 
            className="border border-gray-300 rounded-md overflow-hidden shadow-md" 
            style={{ width: canvasSize.width, height: canvasSize.height }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleMouseDown}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
              className="cursor-crosshair"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Points: {edges.length}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetToDefault}
              className="border-gray-200"
            >
              <Check className="h-4 w-4 mr-1" /> Reset to Default
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearPoints}
              className="text-red-500 border-red-200 hover:bg-red-50"
              disabled={edges.length === 0}
            >
              <Trash className="h-4 w-4 mr-1" /> Clear All
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="bg-[var(--tensora-dark)] hover:bg-[var(--tensora-medium)]"
              onClick={handleSave}
              disabled={edges.length < 3}
            >
              <Save className="h-4 w-4 mr-1" /> Save Masking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}