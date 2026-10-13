import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export default function IndicatorCard({ icon: Icon, label, value, loading, color = "primary" }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-1 h-7 w-8 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}