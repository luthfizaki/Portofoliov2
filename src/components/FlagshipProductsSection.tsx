import { useEffect, useRef } from "react";
import { useContent } from "../context/ContentContext";

export function FlagshipProductsSection() {
  const { flagshipProducts } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "flagship-products-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.02 }
    );

    sectionObserver.observe(section);

    return () => {
      sectionObserver.disconnect();
      document.body.classList.remove("flagship-products-is-visible");
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const projectObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("project-is-visible");
          }
        }
      },
      { rootMargin: "-10% 0px -12%", threshold: 0.12 }
    );

    section
      .querySelectorAll<HTMLElement>(".flagship-products__project")
      .forEach((project) => projectObserver.observe(project));

    return () => projectObserver.disconnect();
  }, [flagshipProducts.projects]);

  return (
    <section
      ref={sectionRef}
      id="flagship-products"
      className="flagship-products section-reveal"
      aria-labelledby="flagship-products-heading"
    >
      <div className="flagship-products__frame">
        <div className="flagship-products__top-rule" />

        <header className="flagship-products__header">
          <div className="flagship-products__label" data-reveal="1">
            <span className="flagship-products__number">
              {flagshipProducts.sectionNumber}
            </span>
            <span className="flagship-products__label-rule" />
            <span>{flagshipProducts.sectionLabel}</span>
          </div>

          <div className="flagship-products__header-grid">
            <h2 id="flagship-products-heading" data-reveal="2">
              {flagshipProducts.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p data-reveal="3">{flagshipProducts.intro}</p>
          </div>
        </header>

        <div className="flagship-products__projects">
          {flagshipProducts.projects.map((project, index) => {
            const projectLinkUrl = project.linkUrl;
            const isMediaLeft = project.layout === "media-left";
            const projectClassName = [
              "flagship-products__project",
              isMediaLeft ? "is-media-left" : "is-media-right",
              project.featured ? "is-primary" : ""
            ]
              .filter(Boolean)
              .join(" ");

            const details = [
              ["ROLE", project.role],
              ["PLATFORM", project.platform],
              ["SCOPE", project.scope]
            ];

            return (
              <div key={`${project.number}-${project.titleLines.join("-")}`}>
                <article className={projectClassName}>
                  <div className="flagship-products__copy">
                    <div className="flagship-products__project-label">
                      <span>{project.number}</span>
                      <span>{project.eyebrow}</span>
                    </div>

                    <h3>
                      {project.titleLines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </h3>

                    <p className="flagship-products__description">
                      {project.description}
                    </p>

                    <dl className="flagship-products__details">
                      {details.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>

                    {projectLinkUrl ? (
                      <a className="flagship-products__link" href={projectLinkUrl}>
                        <span>{project.linkLabel}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="flagship-products__link">
                        <span>{project.linkLabel}</span>
                        <span aria-hidden="true">↗</span>
                      </span>
                    )}

                    {index === flagshipProducts.projects.length - 1 && (
                      <p className="flagship-products__footer-note">
                        {flagshipProducts.footerNote}
                      </p>
                    )}
                  </div>

                  <div className="flagship-products__visual-shell">
                    <span
                      className="flagship-products__hover-light"
                      aria-hidden="true"
                    />
                    <div className="flagship-products__visual">
                      {project.glowUrl && (
                        <img
                          className="flagship-products__visual-glow"
                          src={project.glowUrl}
                          alt=""
                          aria-hidden="true"
                        />
                      )}
                      {projectLinkUrl ? (
                        <a href={projectLinkUrl} aria-label={`Open ${project.titleLines.join(" ")} case study`}>
                          {project.visualUrl && (
                            <img
                              className="flagship-products__visual-image"
                              src={project.visualUrl}
                              alt={project.visualAlt}
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </a>
                      ) : (
                        project.visualUrl && (
                          <img
                            className="flagship-products__visual-image"
                            src={project.visualUrl}
                            alt={project.visualAlt}
                            loading="lazy"
                            decoding="async"
                          />
                        )
                      )}
                    </div>
                  </div>
                </article>

                {index < flagshipProducts.projects.length - 1 && (
                  <div
                    className={`flagship-products__project-divider is-after-${index + 1}`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
