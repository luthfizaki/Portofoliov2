import { useEffect, useRef, type CSSProperties } from "react";
import { useContent } from "../context/ContentContext";

const stepAccents = {
  blue: "#377dff",
  periwinkle: "#8caaff",
  warm: "#c69a72",
  green: "#40d19e"
} as const;

export function HowIWorkSection() {
  const { howIWork } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "how-i-work-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("how-i-work-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-i-work"
      className="how-i-work section-reveal"
      aria-labelledby="how-i-work-heading"
    >
      <div className="how-i-work__frame">
        <div className="how-i-work__top-rule" />

        <header className="how-i-work__header">
          <div className="how-i-work__label" data-reveal="1">
            <span className="how-i-work__section-number">
              {howIWork.sectionNumber}
            </span>
            <span className="how-i-work__label-rule" />
            <span>{howIWork.sectionLabel}</span>
          </div>

          <div className="how-i-work__header-grid">
            <h2 id="how-i-work-heading" data-reveal="2">
              {howIWork.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>

            <div className="how-i-work__intro" data-reveal="3">
              <p>{howIWork.intro}</p>
              <span>{howIWork.processNote}</span>
            </div>
          </div>
        </header>

        <div className="how-i-work__process">
          {howIWork.steps.map((step, index) => {
            const accent =
              stepAccents[step.accent as keyof typeof stepAccents] ||
              stepAccents.blue;
            const stepStyle = {
              "--step-accent": accent,
              "--step-delay": `${240 + index * 90}ms`
            } as CSSProperties;

            return (
              <article
                className="how-i-work__step"
                style={stepStyle}
                key={step.number}
              >
                <span className="how-i-work__step-number">
                  <span>{step.number}</span>
                  <span className="how-i-work__step-name">
                    {` / ${step.titleLines.join(" ")}`}
                  </span>
                </span>
                <h3>
                  {step.titleLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
                <p>{step.description}</p>
                <div className="how-i-work__tags">
                  {step.tags.map((tag, tagIndex) => (
                    <span key={tag}>
                      {tagIndex > 0 && <i aria-hidden="true">/</i>}
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="how-i-work__collaboration" data-reveal="8">
          <div className="how-i-work__collaboration-copy">
            <span>{howIWork.collaborationLabel}</span>
            <p>{howIWork.collaborationText}</p>
          </div>

          <div className="how-i-work__dots" aria-hidden="true">
            {howIWork.collaborationDots.map((dot, index) => (
              <img
                src={dot}
                alt=""
                style={{ "--dot-index": index } as CSSProperties}
                key={dot}
              />
            ))}
          </div>

          <span className="how-i-work__collaboration-note">
            {howIWork.collaborationNote}
          </span>
        </aside>

        <p className="how-i-work__footer-note" data-reveal="9">
          {howIWork.footerNote}
        </p>

        <span className="how-i-work__watermark" aria-hidden="true">
          {howIWork.sectionNumber}
        </span>
      </div>
    </section>
  );
}
