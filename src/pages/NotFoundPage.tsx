import { useCallback, useEffect, useRef, useState } from "react";

const LOST_ART_NAMES = ["ground", "trees-left", "giant", "trees-right"] as const;

const ART = {
  giant: { width: 841, height: 1800 },
  ground: { width: 2400, height: 152 },
  treesLeft: { width: 1600, height: 1302 },
  treesRight: { width: 1600, height: 1434 },
} as const;

type LostArtName = (typeof LOST_ART_NAMES)[number];

function LostArt({
  name,
  width,
  height,
  className = "",
  onVisibleLoad,
}: {
  name: LostArtName;
  width: number;
  height: number;
  className?: string;
  onVisibleLoad?: () => void;
}) {
  const reportedLoad = useRef(false);

  const reportVisibleLoad = useCallback(() => {
    if (reportedLoad.current) return;
    reportedLoad.current = true;
    onVisibleLoad?.();
  }, [onVisibleLoad]);

  const bindVisibleImage = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete) reportVisibleLoad();
    },
    [reportVisibleLoad],
  );

  return (
    <div className={`lost-art ${className}`.trim()} aria-hidden="true">
      <img
        ref={bindVisibleImage}
        className="lost-art-on-dark"
        src={`/images/${name}.webp`}
        alt=""
        width={width}
        height={height}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        onLoad={reportVisibleLoad}
        onError={reportVisibleLoad}
      />
      <img
        className="lost-art-on-light"
        src={`/images/${name}-clear.webp`}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

export default function NotFoundPage() {
  const [artReady, setArtReady] = useState(false);
  const loadedArtCount = useRef(0);

  const markArtLoaded = useCallback(() => {
    loadedArtCount.current += 1;
    if (loadedArtCount.current >= LOST_ART_NAMES.length) {
      setArtReady(true);
    }
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = "404 · HackUTA 2026";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    const preloadLinks = LOST_ART_NAMES.map((name) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.type = "image/webp";
      link.href = `/images/${name}.webp`;
      document.head.append(link);
      return link;
    });

    return () => {
      preloadLinks.forEach((link) => link.remove());
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#lost-title">
        Skip to content
      </a>
      <main id="main-content" tabIndex={-1}>
        <section
          className="lost-page"
          data-theme="dark"
          data-art-ready={artReady ? "true" : "false"}
          aria-labelledby="lost-title"
        >
          <LostArt
            name="ground"
            className="lost-ground"
            width={ART.ground.width}
            height={ART.ground.height}
            onVisibleLoad={markArtLoaded}
          />
          <LostArt
            name="trees-left"
            className="lost-trees-left"
            width={ART.treesLeft.width}
            height={ART.treesLeft.height}
            onVisibleLoad={markArtLoaded}
          />
          <LostArt
            name="giant"
            className="lost-giant"
            width={ART.giant.width}
            height={ART.giant.height}
            onVisibleLoad={markArtLoaded}
          />
          <LostArt
            name="trees-right"
            className="lost-trees-right"
            width={ART.treesRight.width}
            height={ART.treesRight.height}
            onVisibleLoad={markArtLoaded}
          />

          <div className="lost-copy">
            <p className="lost-kicker uppercase">Off course</p>
            <h1 id="lost-title" className="lost-title">
              404
            </h1>
            <p className="lost-message">This shore is not on the map.</p>
            <a className="odyssey-btn inline-flex items-center justify-center" href="/">
              Return home
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
