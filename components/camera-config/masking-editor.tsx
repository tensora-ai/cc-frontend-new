"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, Save, Trash, Upload, Info, ImageIcon } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ 
    width: resolution[0], 
    height: resolution[1] 
  });
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate the appropriate canvas size based on screen constraints
  useEffect(() => {
    const calculateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.6, 1200); // 60% of window width, max 1200px
      const maxHeight = Math.min(window.innerHeight * 0.6, 800); // 60% of window height, max 800px
      
      // Calculate scale factor based on the limiting dimension
      const widthScale = maxWidth / resolution[0];
      const heightScale = maxHeight / resolution[1];
      const scale = Math.min(widthScale, heightScale, 1); // Never scale up, only down
      
      // Calculate the scaled dimensions - use Math.floor to ensure no overflow
      const scaledWidth = Math.floor(resolution[0] * scale);
      const scaledHeight = Math.floor(resolution[1] * scale);
      
      setCanvasSize({ width: scaledWidth, height: scaledHeight });
      setScaleFactor(scale);
    };
    
    calculateCanvasSize();
    
    // Also recalculate on window resize
    window.addEventListener('resize', calculateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', calculateCanvasSize);
    };
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

  // Helper function to draw the grid - memoized with useCallback
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = 50; // Grid size in original resolution
    const scaledGridSizeX = gridSize * scaleFactor;
    const scaledGridSizeY = gridSize * scaleFactor;
    
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvasSize.width; x += scaledGridSizeX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvasSize.height; y += scaledGridSizeY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  }, [canvasSize.height, canvasSize.width, scaleFactor]);

  // Helper function to draw the polygon - memoized with useCallback
  const drawPolygon = useCallback((ctx: CanvasRenderingContext2D) => {
    if (edges.length === 0) return;
    
    ctx.beginPath();
    
    // Scale the first point
    const startX = edges[0][0] * scaleFactor;
    const startY = edges[0][1] * scaleFactor;
    
    ctx.moveTo(startX, startY);
    
    // Draw lines to each point
    for (let i = 1; i < edges.length; i++) {
      const x = edges[i][0] * scaleFactor;
      const y = edges[i][1] * scaleFactor;
      ctx.lineTo(x, y);
    }
    
    // Close the path
    ctx.lineTo(startX, startY);
    
    // Set styles and draw
    ctx.fillStyle = "rgba(91, 94, 150, 0.4)"; // Tensora medium purple with transparency
    ctx.strokeStyle = "rgba(29, 27, 68, 0.9)"; // Tensora dark purple with transparency
    ctx.lineWidth = 2;
    
    ctx.fill();
    ctx.stroke();
    
    // Draw vertices
    edges.forEach((point, index) => {
      const x = point[0] * scaleFactor;
      const y = point[1] * scaleFactor;
      
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
      
      // Draw point indices for better reference
      ctx.font = "10px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(index.toString(), x, y);
    });
  }, [edges, dragIndex, scaleFactor]);

  // Helper function to draw the scale indicator - memoized with useCallback
  const drawScaleIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    const padding = 10;
    const scaleText = `Scale: ${Math.round(scaleFactor * 100)}% (1:${(1/scaleFactor).toFixed(1)})`;
    const resolutionText = `${resolution[0]}×${resolution[1]}px`;
    
    ctx.font = "12px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    
    // Draw the background for better readability
    const textWidth = ctx.measureText(scaleText).width;
    const boxWidth = textWidth + 10;
    const boxHeight = 45;
    
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(
      canvasSize.width - boxWidth - padding, 
      canvasSize.height - boxHeight - padding,
      boxWidth,
      boxHeight
    );
    
    // Draw the text
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillText(
      scaleText, 
      canvasSize.width - padding - 5, 
      canvasSize.height - padding - 20
    );
    
    ctx.fillText(
      resolutionText, 
      canvasSize.width - padding - 5, 
      canvasSize.height - padding - 5
    );
  }, [canvasSize.width, canvasSize.height, scaleFactor, resolution]);

  // Redraw the canvas when relevant state changes
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if available
    if (backgroundImage) {
      ctx.globalAlpha = 1.0;
      ctx.drawImage(
        backgroundImage, 
        0, 0, 
        canvas.width, 
        canvas.height
      );
      
      // Add semi-transparent overlay for better contrast if enabled
      if (showOverlay) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      // Draw a grid background to visualize the area if no background image
      drawGrid(ctx);
    }
    
    // Draw the polygon
    if (edges.length > 0) {
      drawPolygon(ctx);
    }
    
    // Draw border
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw scale indicator in bottom right corner
    drawScaleIndicator(ctx);
    
  }, [edges, dragIndex, canvasSize, backgroundImage, showOverlay, scaleFactor, isOpen, drawGrid, drawPolygon, drawScaleIndicator]);

  // Convert canvas coordinates to original resolution coordinates
  const canvasToOriginalCoords = useCallback((
    canvasX: number, 
    canvasY: number
  ): [number, number] => {
    // Convert to original resolution
    const originalX = Math.round(canvasX / scaleFactor);
    const originalY = Math.round(canvasY / scaleFactor);
    
    // Clamp the values to stay within the resolution bounds
    return [
      Math.max(0, Math.min(resolution[0], originalX)),
      Math.max(0, Math.min(resolution[1], originalY))
    ];
  }, [resolution, scaleFactor]);

  // Add document-wide event listeners for mouse up and mouse move
  useEffect(() => {
    // Only add listeners if we're in dragging mode
    if (dragIndex !== null) {
      const handleDocumentMouseUp = () => {
        setDragIndex(null);
      };
      
      const handleDocumentMouseMove = (e: MouseEvent) => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate position relative to canvas
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Clamp mouse position to canvas bounds
        x = Math.max(0, Math.min(canvas.width, x));
        y = Math.max(0, Math.min(canvas.height, y));
        
        // Convert to original resolution and update point
        const [originalX, originalY] = canvasToOriginalCoords(x, y);
        
        const newEdges = [...edges];
        newEdges[dragIndex] = [originalX, originalY];
        setEdges(newEdges);
      };
      
      // Add document-wide event listeners
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('mousemove', handleDocumentMouseMove);
      
      // Clean up
      return () => {
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('mousemove', handleDocumentMouseMove);
      };
    }
  }, [dragIndex, edges, canvasToOriginalCoords]);
  
  // Find if we're clicking near a vertex (for dragging)
  const findNearbyVertex = (
    canvasX: number, 
    canvasY: number
  ): number | null => {
    // Check each vertex
    for (let i = 0; i < edges.length; i++) {
      const vertexX = edges[i][0] * scaleFactor;
      const vertexY = edges[i][1] * scaleFactor;
      
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

  // Find the best place to insert a new point
  const findInsertionIndex = (newPoint: [number, number]): number => {
    if (edges.length < 2) return edges.length;
    
    // Find the edge (line segment) that is closest to the new point
    let closestEdgeIndex = -1;
    let minDistance = Infinity;
    
    // Check distance to each edge
    for (let i = 0; i < edges.length; i++) {
      const startPoint = edges[i];
      const endPoint = edges[(i + 1) % edges.length]; // Wrap around to first point
      
      // Calculate distance from point to line segment
      const distance = distanceToLineSegment(newPoint, startPoint, endPoint);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestEdgeIndex = i;
      }
    }
    
    // Return the index after the start of the closest edge
    return (closestEdgeIndex + 1) % edges.length;
  };
  
  // Calculate the distance from a point to a line segment
  const distanceToLineSegment = (
    point: [number, number], 
    lineStart: [number, number], 
    lineEnd: [number, number]
  ): number => {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    // Calculate squared length of line segment
    const lengthSquared = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    
    // If segment is a point, calculate direct distance
    if (lengthSquared === 0) return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
    
    // Calculate projection of point onto line
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
    
    // Calculate closest point on line
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    
    // Return distance to closest point
    return Math.sqrt(Math.pow(x - projectionX, 2) + Math.pow(y - projectionY, 2));
  };

  // Handle mouse event handlers for the canvas
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
      const newPoint: [number, number] = [originalX, originalY];
      
      // Find the best insertion index
      const insertIndex = findInsertionIndex(newPoint);
      
      // Insert the new point at the calculated position
      const newEdges = [...edges];
      newEdges.splice(insertIndex, 0, newPoint);
      setEdges(newEdges);
    }
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

  // Handle file upload for the background image
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }
    
    // Load the image
    const reader = new FileReader();
    reader.onload = () => {
      // Use the window.Image constructor to avoid TypeScript errors
      const img = new window.Image();
      img.onload = () => {
        // Check if the aspect ratio matches the camera resolution
        const imgAspectRatio = img.width / img.height;
        const cameraAspectRatio = resolution[0] / resolution[1];
        
        // Allow a small difference in aspect ratio (2% tolerance)
        if (Math.abs(imgAspectRatio - cameraAspectRatio) > 0.02) {
          setErrorMessage(`Warning: Image aspect ratio (${imgAspectRatio.toFixed(2)}) doesn't match camera (${cameraAspectRatio.toFixed(2)}). The image will be stretched.`);
        } else {
          setErrorMessage(null);
        }
        
        setBackgroundImage(img);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Toggle overlay
  const handleToggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  // Handle save
  const handleSave = () => {
    // Ensure we have at least 3 points for a valid polygon
    if (edges.length < 3) {
      setErrorMessage("Please add at least 3 points to create a valid masking area");
      return;
    }
    
    setErrorMessage(null);
    onSave(edges);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-auto max-w-[90vw] max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--tensora-dark)]">Edit Masking Area</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
        
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Camera Resolution</h3>
              <p className="text-xs text-gray-600">
                {resolution[0]} × {resolution[1]} pixels
                {scaleFactor < 1 && (
                  <span className="ml-2 text-orange-600">
                    (Scaled to {Math.round(scaleFactor * 100)}% for display)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUploadClick}
                className="flex items-center"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Reference Image
              </Button>
              
              {backgroundImage && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggleOverlay}
                  className="flex items-center"
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                  {showOverlay ? "Remove Contrast" : "Add Contrast"}
                </Button>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 flex justify-center">
            <div 
              className="border border-gray-300 rounded-md overflow-hidden shadow-md bg-gray-100"
              style={{ width: canvasSize.width, height: canvasSize.height }}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
                className="cursor-crosshair"
              />
            </div>
          </div>
          
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-full">
              <h3 className="text-sm font-medium mb-3">Instructions</h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-1.5">•</span>
                  <span>Click anywhere to add points</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-1.5">•</span>
                  <span>Drag points to reposition them</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-1.5">•</span>
                  <span>Right-click on a point to delete it</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 mr-1.5">•</span>
                  <span>Upload an image to use as reference</span>
                </li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium mb-2">Current Mask</p>
                <p className="text-xs text-gray-600 mb-1">Points: {edges.length}</p>
                <div className="text-xs text-gray-600 mb-3">
                  {edges.length >= 3 ? 
                    <span className="text-green-600">✓ Valid polygon</span> : 
                    <span className="text-red-600">⚠ Need at least 3 points</span>
                  }
                </div>
                
                {/* Point coordinates display */}
                {edges.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Point Coordinates:</p>
                    <div className="max-h-32 overflow-y-auto pr-1 text-xs bg-gray-100 rounded-sm">
                      {edges.map((point, index) => (
                        <div key={index} className="flex justify-between p-1 hover:bg-gray-200">
                          <span>Point {index}:</span>
                          <span>({point[0]}, {point[1]})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetToDefault}
                    className="w-full text-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Reset to Full Frame
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearPoints}
                    className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                    disabled={edges.length === 0}
                  >
                    <Trash className="h-3.5 w-3.5 mr-1" /> Clear All Points
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {scaleFactor < 1 ? 
              `Display scale: ${Math.round(scaleFactor * 100)}% • Original resolution: ${resolution[0]}×${resolution[1]}px` : 
              `Full resolution: ${resolution[0]}×${resolution[1]}px`
            }
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