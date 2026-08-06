import { useEffect, useRef } from "react";
import { useContent } from "../context/ContentContext";

const mobileHiddenCopySuffix = " from early exploration through UAT.";

export function AboutSection() {
  const { about } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("about-is-visible", entry.isIntersecting);
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("about-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="about-editorial section-reveal"
      aria-labelledby="about-heading"
    >
      <div className="about-editorial__frame">
        <div className="about-editorial__top-rule" />

        <div className="about-editorial__grid">
          <div className="about-editorial__headline-column">
            <div className="about-editorial__label" data-reveal="1">
              <span className="about-editorial__number">
                {about.sectionNumber}
              </span>
              <span className="about-editorial__label-rule" />
              <span>{about.sectionLabel}</span>
            </div>

            <h2 id="about-heading" className="about-editorial__headline" data-reveal="2">
              {about.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>

            <div className="about-editorial__focus" data-reveal="5">
              <span className="about-editorial__focus-rule" />
              <p>{about.focus}</p>
            </div>
          </div>

          <div className="about-editorial__story-column">
            <p className="about-editorial__lead" data-reveal="3">{about.lead}</p>

            <div className="about-editorial__copy" data-reveal="4">
              {about.paragraphs.map((paragraph) => {
                const hasResponsiveEnding = paragraph.endsWith(mobileHiddenCopySuffix);

                return (
                  <p key={paragraph}>
                    {hasResponsiveEnding
                      ? paragraph.slice(0, -mobileHiddenCopySuffix.length)
                      : paragraph}
                    {hasResponsiveEnding && (
                      <>
                        <span className="about-editorial__mobile-period">.</span>
                        <span className="about-editorial__desktop-copy-ending">
                          {mobileHiddenCopySuffix}
                        </span>
                      </>
                    )}
                  </p>
                );
              })}
            </div>

            <dl className="about-editorial__metrics" data-reveal="6">
              {about.metrics.map((metric) => (
                <div className="about-editorial__metric" key={metric.label}>
                  <dd>{metric.value}</dd>
                  <dt>
                    {metric.label}
                    {metric.value.toUpperCase() === "INDONESIA" && (
                      <span className="about-editorial__metric-timezone"> (GMT+7)</span>
                    )}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="about-editorial__portrait" data-reveal="3" aria-hidden="true">
            <picture>
              <source media="(max-width: 1023px)" srcSet="/about-mobile-portrait.png" />
              <img src={about.portraitUrl} alt="" />
            </picture>
          </div>
        </div>

        <p className="about-editorial__footer-note" data-reveal="7">{about.footerNote}</p>
        <span className="about-editorial__watermark" aria-hidden="true">
          {about.sectionNumber}
        </span>
      </div>
    </section>
  );
}
