import React, { useMemo } from "react";

interface SvgParticleBuildingProps {
  className?: string;
}

export const SvgParticleBuilding: React.FC<SvgParticleBuildingProps> = ({ className = "" }) => {
  // Generate a matrix of dots forming building/arch contours
  const dots = useMemo(() => {
    const rows = 50;
    const cols = 90;
    const items = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c / cols) * 100;
        const y = (r / rows) * 100;

        // Architectural arches and house shapes
        const dx1 = x - 30;
        const dy1 = y - 60;
        const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        const dx2 = x - 70;
        const dy2 = y - 60;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        // Building arches condition
        const inArch1 = dist1 > 12 && dist1 < 36 && y > 20;
        const inArch2 = dist2 > 12 && dist2 < 36 && y > 20;
        const inCenterBuilding = x > 40 && x < 60 && y > 30 && y < 85;

        if (inArch1 || inArch2 || inCenterBuilding) {
          const isHighlight = (r * 7 + c * 13) % 17 === 0;
          const isAccent = (r * 11 + c * 5) % 19 === 0;
          
          let opacity = 0.15;
          if (inArch1 || inArch2) opacity += 0.2;
          if (isHighlight) opacity += 0.35;

          let color = "currentColor";
          if (isAccent) {
            color = "#f97316"; // Orange accent like in OriginKit Hero 20
            opacity = 0.75;
          } else if (isHighlight) {
            color = "#ea580c";
            opacity = 0.5;
          }

          items.push({
            id: `${r}-${c}`,
            cx: `${x}%`,
            cy: `${y}%`,
            r: isAccent ? 1.8 : 1.3,
            opacity: Math.min(opacity, 0.8),
            color,
          });
        }
      }
    }
    return items;
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="w-full h-full text-foreground/20 dark:text-white/20 opacity-85" xmlns="http://www.w3.org/2000/svg">
        <g>
          {dots.map((dot) => (
            <circle
              key={dot.id}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={dot.color}
              opacity={dot.opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SvgParticleBuilding;
