import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { Boxes, Compass, Layers3, PenTool, Wrench } from "lucide-react";
import { useContent } from "../context/ContentContext";

const categoryIcons = {
  Discovery: Compass,
  Interface: PenTool,
  System: Layers3,
  Implementation: Wrench,
} as const;

export function SkillsSection() {
  const { skills } = useContent();
  const sectionRef = useRef<HTMLElement>(null);
  const featured = useMemo(() => skills.items.filter((item) => item.featured), [skills.items]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("skills-is-visible", entry.isIntersecting);
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("skills-is-visible");
    };
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="skills-section section-reveal" aria-labelledby="skills-heading">
      <div className="skills-section__frame">
        <div className="skills-section__top-rule" />

        <header className="skills-section__header">
          <div className="skills-section__label" data-reveal="1">
            <span className="skills-section__number">{skills.sectionNumber}</span>
            <span className="skills-section__label-rule" />
            <span>{skills.sectionLabel}</span>
          </div>

          <div className="skills-section__header-grid">
            <h2 id="skills-heading" data-reveal="2">
              {skills.headlineLines.map((line) => <span key={line}>{line}</span>)}
            </h2>
            <div className="skills-section__intro" data-reveal="3">
              <p>{skills.intro}</p>
              <span>{skills.summary}</span>
            </div>
          </div>
        </header>

        <div className="skills-section__layout">
          <aside className="skills-section__map" data-reveal="4">
            <span>{skills.summaryLabel}</span>
            <div className="skills-section__category-list">
              {skills.categories.map((category) => {
                const Icon = categoryIcons[category.name as keyof typeof categoryIcons] ?? Boxes;
                return (
                  <div className="skills-section__category" key={category.name}>
                    <Icon size={18} strokeWidth={1.7} />
                    <strong>{category.name}</strong>
                    <small>{String(category.count).padStart(2, "0")}</small>
                  </div>
                );
              })}
            </div>
            <div className="skills-section__featured">
              <small>Featured stack</small>
              <strong>{featured.map((item) => item.name).join(" / ")}</strong>
            </div>
          </aside>

          <div className="skills-section__grid">
            {skills.items.map((item, index) => {
              const style = {
                "--skill-level": `${Math.max(0, Math.min(100, item.level))}%`,
                "--skill-delay": `${180 + index * 70}ms`,
              } as CSSProperties;

              return (
                <article className={`skills-section__card${item.featured ? " is-featured" : ""}`} key={`${item.category}-${item.name}`} style={style}>
                  <div className="skills-section__card-top">
                    <span>{item.category}</span>
                    <b>{item.level}%</b>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="skills-section__meter" aria-label={`${item.name} level ${item.level} percent`}>
                    <i />
                  </div>
                  <div className="skills-section__tools">
                    {item.tools.map((tool) => <span key={tool}>{tool}</span>)}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <p className="skills-section__footer-note">{skills.footerNote}</p>
        <span className="skills-section__watermark" aria-hidden="true">{skills.sectionNumber}</span>
      </div>
    </section>
  );
}
