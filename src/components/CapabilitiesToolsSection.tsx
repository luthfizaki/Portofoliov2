import { useEffect, useRef, type CSSProperties } from "react";
import { useContent } from "../context/ContentContext";

const accentColors = {
  blue: "#124eca",
  ink: "#0a1424",
  warm: "#b7895b"
} as const;

export function CapabilitiesToolsSection() {
  const { capabilitiesTools } = useContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "capabilities-tools-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("capabilities-tools-is-visible");
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capabilities-tools"
      className="capabilities-tools section-reveal"
      aria-labelledby="capabilities-tools-heading"
    >
      <div className="capabilities-tools__frame">
        <div className="capabilities-tools__top-rule" />

        <header>
          <div className="capabilities-tools__label" data-reveal="1">
            <span className="capabilities-tools__number">
              {capabilitiesTools.sectionNumber}
            </span>
            <span className="capabilities-tools__label-rule" />
            <span>{capabilitiesTools.sectionLabel}</span>
          </div>

          <div className="capabilities-tools__header-grid">
            <h2 id="capabilities-tools-heading" data-reveal="2">
              {capabilitiesTools.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>

            <div className="capabilities-tools__intro" data-reveal="3">
              <p>{capabilitiesTools.intro}</p>
              <span>{capabilitiesTools.applicationNote}</span>
            </div>
          </div>
        </header>

        <div className="capabilities-tools__cards">
          {capabilitiesTools.capabilities.map((capability, index) => {
            const accent =
              accentColors[capability.accent as keyof typeof accentColors] ||
              accentColors.blue;
            const cardStyle = {
              "--capability-accent": accent,
              "--capability-delay": `${220 + index * 90}ms`
            } as CSSProperties;

            return (
              <article
                className={`capabilities-tools__card is-${capability.tone}`}
                key={capability.number}
                style={cardStyle}
              >
                <span className="capabilities-tools__card-number">
                  {capability.number}
                </span>
                <h3>{capability.title}</h3>
                <div className="capabilities-tools__card-detail">
                  <p>{capability.description}</p>
                  <div className="capabilities-tools__tags">
                    {capability.tags.map((tag, tagIndex) => (
                      <span key={tag}>
                        {tagIndex > 0 && <i aria-hidden="true">/</i>}
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="capabilities-tools__badge">
                  <strong>{capability.badge}</strong>
                  <span>APPLIED IN REAL PROJECTS</span>
                </div>
              </article>
            );
          })}
        </div>

        <section className="capabilities-tools__tools" aria-label="Tools I work with">
          <div className="capabilities-tools__tools-copy" data-reveal="7">
            <span>{capabilitiesTools.toolsLabel}</span>
            <p>{capabilitiesTools.toolsDescription}</p>
          </div>

          <div className="capabilities-tools__tool-list" data-reveal="8">
            {capabilitiesTools.tools.map((tool, index) => {
              const delay = index === 0 ? 0 : -(12 - index * 2);
              const toolStyle = {
                "--tool-delay": `${delay}s`
              } as CSSProperties;

              return (
                <span
                  className={tool.featured ? "is-featured" : ""}
                  style={toolStyle}
                  key={tool.label}
                >
                  {tool.label}
                </span>
              );
            })}
          </div>
        </section>

        <span className="capabilities-tools__watermark" aria-hidden="true">
          {capabilitiesTools.sectionNumber}
        </span>
      </div>
    </section>
  );
}
