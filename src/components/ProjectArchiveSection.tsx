import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { useContent } from "../context/ContentContext";

export function ProjectArchiveSection() {
  const { projectArchive } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "project-archive-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("project-archive-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="project-archive"
      className={`project-archive section-reveal${projectArchive.projects.length <= 4 ? " project-archive--compact" : ""}`}
      aria-labelledby="project-archive-heading"
    >
      <div className="project-archive__frame">
        <div className="project-archive__top-rule" />

        <header className="project-archive__header">
          <div className="project-archive__label" data-reveal="1">
            <span className="project-archive__number">
              {projectArchive.sectionNumber}
            </span>
            <span className="project-archive__label-rule" />
            <span>{projectArchive.sectionLabel}</span>
          </div>

          <div className="project-archive__header-grid">
            <h2 id="project-archive-heading" data-reveal="2">
              {projectArchive.headline}
            </h2>
            <p data-reveal="3">{projectArchive.intro}</p>
          </div>
        </header>

        <div className="project-archive__table">
          <div className="project-archive__columns" data-reveal="4" aria-hidden="true">
            <span>YEAR</span>
            <span>PROJECT</span>
            <span>CATEGORY</span>
            <span>OUTPUT</span>
            <span />
          </div>

          <div
            className="project-archive__rows"
            data-lenis-prevent
            tabIndex={0}
            aria-label="Project archive list"
          >
            {projectArchive.projects.map((project, index) => {
              const rowStyle = {
                "--archive-delay": `${220 + index * 48}ms`
              } as CSSProperties;

              return (
                <a
                  className={`project-archive__row has-link${project.featured ? " is-featured" : ""}`}
                  href={project.linkUrl || "#project-archive"}
                  aria-label={`Open ${project.title} project details`}
                  style={rowStyle}
                  key={`${project.year}-${project.title}`}
                >
                  <span className="project-archive__year">{project.year}</span>
                  <strong>{project.title}</strong>
                  <span className="project-archive__category">
                    {project.category}
                  </span>
                  <span className="project-archive__output">
                    {project.output}
                  </span>
                  <span className="project-archive__arrow" aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <p className="project-archive__footer-note">
          {projectArchive.footerNote}
        </p>
      </div>
    </section>
  );
}
