"use client";

import { Users, TrendingUp, ArrowDown, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsPanelProps {
  current: number;
  maximum: number;
  average: number;
  minimum: number;
}

export function StatsPanel({
  current,
  maximum,
  average,
  minimum
}: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Current Count - Most prominent */}
      <Card className="overflow-hidden border-t-2 border-t-[var(--tensora-medium)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Current</p>
            <div className="bg-[var(--tensora-light)]/10 p-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5 text-[var(--tensora-medium)]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--tensora-dark)]">{current}</p>
        </CardContent>
      </Card>
      
      {/* Maximum Count */}
      <Card className="overflow-hidden border-t-2 border-t-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Maximum</p>
            <div className="bg-blue-50 p-1.5 rounded-full">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{maximum}</p>
        </CardContent>
      </Card>
      
      {/* Average Count */}
      <Card className="overflow-hidden border-t-2 border-t-amber-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Average</p>
            <div className="bg-amber-50 p-1.5 rounded-full">
              <Users className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{average}</p>
        </CardContent>
      </Card>
      
      {/* Minimum Count */}
      <Card className="overflow-hidden border-t-2 border-t-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Minimum</p>
            <div className="bg-green-50 p-1.5 rounded-full">
              <ArrowDown className="h-3.5 w-3.5 text-green-500" />
            </div>
          </div>
          <p className="text-xl font-bold">{minimum}</p>
        </CardContent>
      </Card>
    </div>
  );
}