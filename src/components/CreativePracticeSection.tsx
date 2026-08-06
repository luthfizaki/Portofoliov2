import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useContent } from "../context/ContentContext";

export function CreativePracticeSection() {
  const { creativePractice } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "creative-practice-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("creative-practice-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="creative-practice"
      className="creative-practice section-reveal"
      aria-labelledby="creative-practice-heading"
    >
      <div className="creative-practice__frame">
        <div className="creative-practice__top-rule" />

        <header className="creative-practice__header">
          <div className="creative-practice__label" data-reveal="1">
            <span className="creative-practice__number">
              {creativePractice.sectionNumber}
            </span>
            <span className="creative-practice__label-rule" />
            <span>{creativePractice.sectionLabel}</span>
          </div>

          <div className="creative-practice__header-grid">
            <h2 id="creative-practice-heading" data-reveal="2">
              {creativePractice.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p data-reveal="3">{creativePractice.intro}</p>
          </div>
        </header>

        <div className="creative-practice__cards">
          {creativePractice.cards.map((card, index) => (
            <article
              id={card.anchorId}
              className={`creative-practice__card is-${card.theme}`}
              data-reveal={String(index + 4)}
              key={card.number}
            >
              <div className="creative-practice__card-copy">
                <span className="creative-practice__card-number">
                  {card.number}
                </span>
                <h3>
                  {card.titleLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
                <p className="creative-practice__card-description">
                  {card.description}
                </p>
                <a
                  className="creative-practice__card-cta"
                  href={card.linkUrl}
                  target={card.openInNewTab ? "_blank" : undefined}
                  rel={card.openInNewTab ? "noreferrer" : undefined}
                  aria-label={card.linkLabel}
                >
                  <span>VIEW MORE</span>
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.8} />
                </a>
                <p className="creative-practice__card-tags">
                  {card.tags.join("  /  ")}
                </p>
              </div>

              <span className="creative-practice__media" aria-hidden="true">
                <img
                  src={card.imageUrl}
                  alt={card.imageAlt}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </article>
          ))}
        </div>

        <div className="creative-practice__bottom-rule" />
      </div>
    </section>
  );
}
