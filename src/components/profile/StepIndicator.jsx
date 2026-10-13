import React from "react";
import { Check } from "lucide-react";

export default function StepIndicator({ steps, current, onJump }) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-primary text-primary-foreground"
                : done
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {done ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}