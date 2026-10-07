import Image from 'next/image';

// Supplied illustrative architecture, never a listing or live market data.
export function ArchitectureVisual({ alt }: { alt: string }) {
  return (
    <div className="dp-architecture">
      <Image
        className="dp-architecture-image"
        src="/images/architecture/illustrative-building.webp"
        width={1600}
        height={900}
        // A portrait cover crop needs landscape pixels for its full height.
        sizes="(min-width: 1440px) 1200px, (min-width: 1024px) 95vw, calc(100vw - 80px)"
        alt={alt}
        preload
      />
      <svg
        className="dp-architecture-overlay"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g className="dp-visual-grid" stroke="currentColor" strokeWidth="1">
          <path d="M400 0v900M800 0v900M1200 0v900M0 300h1600M0 600h1600" />
        </g>
        <g stroke="currentColor" strokeWidth="2">
          <path d="M56 112V56h100M1444 56h100v56M56 788v56h100M1444 844h100v-56" />
        </g>
        <g className="dp-visual-accent" stroke="currentColor" strokeWidth="3">
          <path d="M1000 230h360v300h-360zM1180 530v220M880 380h120" />
        </g>
      </svg>
    </div>
  );
}
