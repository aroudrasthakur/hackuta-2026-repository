import { useEffect } from "react";
import { Header } from "./Header";

const ART = {
  giant: { width: 841, height: 1800 },
  ground: { width: 2400, height: 152 },
  treesLeft: { width: 1600, height: 1302 },
  treesRight: { width: 1600, height: 1434 },
} as const;

function LostArt({
  name,
  width,
  height,
  className = "",
}: {
  name: "giant" | "ground" | "trees-left" | "trees-right";
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <div className={`lost-art ${className}`.trim()} aria-hidden="true">
      <img
        className="lost-art-on-dark"
        src={`/images/${name}.webp`}
        alt=""
        width={width}
        height={height}
        decoding="async"
        draggable={false}
      />
      <img
        className="lost-art-on-light"
        src={`/images/${name}-clear.webp`}
        alt=""
        width={width}
        height={height}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

export function NotFound() {
  useEffect(() => {
    const previous = document.title;
    document.title = "404 · HackUTA 2026";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#lost-title">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section
          className="lost-page"
          data-theme="dark"
          aria-labelledby="lost-title"
        >
          <LostArt
            name="ground"
            className="lost-ground"
            width={ART.ground.width}
            height={ART.ground.height}
          />
          <LostArt
            name="trees-left"
            className="lost-trees-left"
            width={ART.treesLeft.width}
            height={ART.treesLeft.height}
          />
          <LostArt
            name="giant"
            className="lost-giant"
            width={ART.giant.width}
            height={ART.giant.height}
          />
          <LostArt
            name="trees-right"
            className="lost-trees-right"
            width={ART.treesRight.width}
            height={ART.treesRight.height}
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
