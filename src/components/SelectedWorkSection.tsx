import { useEffect, useRef } from "react";
import { useContent } from "../context/ContentContext";

export function SelectedWorkSection() {
  const { selectedWork } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("selected-work-is-visible", entry.isIntersecting);
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("selected-work-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="selected-work section-reveal"
      aria-labelledby="selected-work-heading"
    >
      <div className="selected-work__frame">
        <div className="selected-work__top-rule" />

        <div className="selected-work__label" data-reveal="1">
          <span className="selected-work__number">{selectedWork.sectionNumber}</span>
          <span className="selected-work__label-rule" />
          <span>{selectedWork.sectionLabel}</span>
        </div>

        <h2 id="selected-work-heading" className="selected-work__headline" data-reveal="2">
          {selectedWork.headlineLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>

        <p className="selected-work__intro" data-reveal="3">
          {selectedWork.intro}
        </p>

        <ol className="selected-work__disciplines" data-reveal="4">
          {selectedWork.disciplines.map((discipline) => (
            <li className={discipline.featured ? "is-featured" : ""} key={discipline.number}>
              <span>{discipline.number}</span>
              <span>{discipline.label}</span>
            </li>
          ))}
        </ol>

        <p className="selected-work__footer-note" data-reveal="6">
          {selectedWork.footerNote}
        </p>

        <div className="selected-work__visual" data-reveal="3" aria-hidden="true">
          <span className="selected-work__glow" />
          <img src={selectedWork.collageUrl} alt="" />
        </div>

        <span className="selected-work__watermark" aria-hidden="true">
          {selectedWork.sectionNumber}
        </span>
      </div>
    </section>
  );
}
