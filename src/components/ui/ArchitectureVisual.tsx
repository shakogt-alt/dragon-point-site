// Decorative architecture, not a property advertisement or live data chart.
export function ArchitectureVisual() {
  return (
    <svg
      className="dp-architecture"
      viewBox="0 0 620 540"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="dp-visual-grid" stroke="currentColor" strokeWidth=".5">
        {Array.from({ length: 13 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 50} 0v540`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 50}h620`} />
        ))}
      </g>
      <g stroke="currentColor" strokeWidth="1.1">
        <path d="m86 350 210 120 238-138-210-120Z M86 350V188l210-122 238 138v128 M86 188l210 122 238-106 M296 310v160 M296 66v244" />
        <path d="m136 218 160-94 187 109v100l-187 108-160-92Z M136 218l160 93 187-78 M296 124v187 M296 311v130" />
        <path d="m186 247 110-65 138 80v71l-138 80-110-63Z M186 247l110 64 138-49" />
        <path d="M86 270l210 122 238-138 M86 309l210 122 238-138" />
      </g>
      <g className="dp-visual-accent" stroke="currentColor" strokeWidth="2">
        <path d="m296 124 187 109v100l-187 108 M296 311l138-49 M296 182v129" />
        <circle cx="296" cy="311" r="5" fill="currentColor" />
        <path d="M296 311H40 M483 233h100" strokeDasharray="3 7" />
      </g>
      <g stroke="currentColor">
        <path d="M18 18h20m-10-10v20 M582 512h20m-10-10v20" />
      </g>
    </svg>
  );
}
