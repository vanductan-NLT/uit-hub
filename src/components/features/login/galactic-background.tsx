/**
 * Full-page galactic background:
 *  - Nebula color gradients (CSS, z:0)
 *  - Canvas starfield: 320 stars w/ twinkling + shooting stars (z:1)
 *  - Constellation SVG line art (z:2)
 */
import StarfieldCanvas from "./starfield-canvas";

export default function GalacticBackground() {
  return (
    <div className="es-galactic-bg" aria-hidden="true">
      {/* Canvas replaces the old CSS dot-star approach */}
      <StarfieldCanvas />

      {/* Constellation line art */}
      <svg
        className="es-constellations"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      >
        {/* Big Dipper */}
        <g className="es-constellation-group es-dipper"
          strokeWidth="0.8" stroke="rgba(147,197,253,0.35)" fill="none" strokeLinecap="round">
          <line x1="200" y1="150" x2="280" y2="180" /><line x1="280" y1="180" x2="350" y2="160" />
          <line x1="350" y1="160" x2="400" y2="140" /><line x1="400" y1="140" x2="420" y2="100" />
          <line x1="420" y1="100" x2="380" y2="80"  /><line x1="380" y1="80"  x2="330" y2="90"  />
          <line x1="330" y1="90"  x2="280" y2="180" />
          <circle cx="200" cy="150" r="1.8" fill="rgba(147,197,253,0.7)" />
          <circle cx="280" cy="180" r="1.8" fill="rgba(147,197,253,0.7)" />
          <circle cx="350" cy="160" r="1.8" fill="rgba(147,197,253,0.7)" />
          <circle cx="400" cy="140" r="1.8" fill="rgba(147,197,253,0.7)" />
          <circle cx="420" cy="100" r="2.4" fill="rgba(196,181,253,0.85)" />
          <circle cx="380" cy="80"  r="1.8" fill="rgba(147,197,253,0.7)" />
          <circle cx="330" cy="90"  r="1.8" fill="rgba(147,197,253,0.7)" />
        </g>

        {/* Orion */}
        <g className="es-constellation-group es-orion"
          strokeWidth="0.8" stroke="rgba(147,197,253,0.3)" fill="none" strokeLinecap="round">
          <line x1="1600" y1="300" x2="1650" y2="280" /><line x1="1650" y1="280" x2="1700" y2="260" />
          <line x1="1700" y1="260" x2="1680" y2="350" /><line x1="1680" y1="350" x2="1620" y2="380" />
          <line x1="1620" y1="380" x2="1550" y2="350" /><line x1="1550" y1="350" x2="1600" y2="300" />
          <line x1="1650" y1="280" x2="1620" y2="380" />
          {/* Orion's belt — slightly brighter */}
          <circle cx="1600" cy="300" r="1.5" fill="rgba(147,197,253,0.6)" />
          <circle cx="1650" cy="280" r="2.2" fill="rgba(253,186,116,0.8)" />
          <circle cx="1700" cy="260" r="1.5" fill="rgba(147,197,253,0.6)" />
          <circle cx="1680" cy="350" r="1.5" fill="rgba(147,197,253,0.6)" />
          <circle cx="1620" cy="380" r="2.2" fill="rgba(147,197,253,0.8)" />
          <circle cx="1550" cy="350" r="1.5" fill="rgba(147,197,253,0.6)" />
        </g>

        {/* Southern Triangle */}
        <g className="es-constellation-group es-triangle"
          strokeWidth="0.8" stroke="rgba(196,181,253,0.4)" fill="none" strokeLinecap="round">
          <line x1="300" y1="800" x2="450" y2="750" />
          <line x1="450" y1="750" x2="400" y2="900" />
          <line x1="400" y1="900" x2="300" y2="800" />
          <circle cx="300" cy="800" r="2" fill="rgba(196,181,253,0.8)" />
          <circle cx="450" cy="750" r="1.6" fill="rgba(196,181,253,0.7)" />
          <circle cx="400" cy="900" r="1.6" fill="rgba(196,181,253,0.7)" />
        </g>
      </svg>
    </div>
  );
}
