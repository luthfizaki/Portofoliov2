import { useEffect, useRef } from "react";
import { useContent } from "../context/ContentContext";

export function ExperienceSection() {
  const { experience } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("experience-is-visible", entry.isIntersecting);
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("experience-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="experience-editorial section-reveal"
      aria-labelledby="experience-heading"
    >
      <div className="experience-editorial__frame">
        <div className="experience-editorial__top-rule" />

        <header className="experience-editorial__header">
          <div className="experience-editorial__label" data-reveal="1">
            <span className="experience-editorial__number">
              {experience.sectionNumber}
            </span>
            <span className="experience-editorial__label-rule" />
            <span>{experience.sectionLabel}</span>
          </div>

          <div className="experience-editorial__hero">
            <h2 id="experience-heading" data-reveal="2">
              {experience.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>

            <div className="experience-editorial__summary" data-reveal="3">
              <p>{experience.intro}</p>
              <div className="experience-editorial__selected">
                <span>{experience.selectedLabel}</span>
                <span>{experience.selectedRange}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="experience-editorial__archive" data-reveal="4">
          <div className="experience-editorial__archive-head" aria-hidden="true">
            <span>YEAR</span>
            <span>ROLE</span>
            <span>COMPANY</span>
            <span>CONTRIBUTION</span>
          </div>

          <div className="experience-editorial__rows">
            {experience.rows.map((row, index) => (
              <article
                className={`experience-editorial__row${row.featured ? " is-featured" : ""}`}
                data-reveal={String(index + 5)}
                key={`${row.year}-${row.role}`}
              >
                <p className="experience-editorial__year">{row.year}</p>
                <h3>{row.role}</h3>
                <p className="experience-editorial__company">{row.company}</p>
                <div className="experience-editorial__contribution">
                  <p>{row.contribution}</p>
                  <span>{row.tags.join("  /  ")}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="experience-editorial__footer-note" data-reveal="9">
          {experience.footerNote}
        </p>
        <span className="experience-editorial__watermark" aria-hidden="true">
          {experience.sectionNumber}
        </span>
      </div>
    </section>
  );
}
