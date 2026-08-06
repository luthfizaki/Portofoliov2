import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useContent } from "../context/ContentContext";

const accentColors = {
  blue: "#377dff",
  purple: "#7b61ff",
  green: "#38c9a7"
} as const;

export function CollaborationTestimonialsSection() {
  const { collaborationTestimonials } = useContent();
  const sectionRef = useRef<HTMLElement>(null);
  const testimonials = collaborationTestimonials.testimonials;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle(
          "collaboration-testimonials-is-visible",
          entry.isIntersecting
        );
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("collaboration-testimonials-is-visible");
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= testimonials.length) setActiveIndex(0);
  }, [activeIndex, testimonials.length]);

  const totalTestimonials = testimonials.length;
  const canSlide = totalTestimonials > 1;
  const goToPrevious = () => {
    setActiveIndex((current) =>
      totalTestimonials ? (current - 1 + totalTestimonials) % totalTestimonials : 0
    );
  };
  const goToNext = () => {
    setActiveIndex((current) =>
      totalTestimonials ? (current + 1) % totalTestimonials : 0
    );
  };

  useEffect(() => {
    if (!canSlide || isAutoPaused) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % totalTestimonials);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [canSlide, isAutoPaused, totalTestimonials]);

  const visibleTestimonials = (() => {
    if (!totalTestimonials) return [];
    if (totalTestimonials === 1) {
      return [{ testimonial: testimonials[0], index: 0, position: "active" }];
    }
    if (totalTestimonials === 2) {
      const nextIndex = (activeIndex + 1) % totalTestimonials;
      return [
        { testimonial: testimonials[activeIndex], index: activeIndex, position: "active" },
        { testimonial: testimonials[nextIndex], index: nextIndex, position: "next" }
      ];
    }
    const previousIndex = (activeIndex - 1 + totalTestimonials) % totalTestimonials;
    const nextIndex = (activeIndex + 1) % totalTestimonials;
    return [
      { testimonial: testimonials[previousIndex], index: previousIndex, position: "previous" },
      { testimonial: testimonials[activeIndex], index: activeIndex, position: "active" },
      { testimonial: testimonials[nextIndex], index: nextIndex, position: "next" }
    ];
  })();

  const renderTestimonial = (
    testimonial: (typeof collaborationTestimonials.testimonials)[number],
    index: number,
    position = "active"
  ) => {
    const accent =
      accentColors[testimonial.accent as keyof typeof accentColors] ||
      accentColors.blue;
    const style = {
      "--testimonial-accent": accent,
      "--testimonial-delay": `${230 + index * 100}ms`
    } as CSSProperties;
    const className = [
      "collaboration-testimonials__card",
      "is-slider-card",
      `is-${position}-card`,
      testimonial.featured ? "is-featured" : ""
    ]
      .filter(Boolean)
      .join(" ");

    const isActive = position === "active";

    return (
      <article
        className={className}
        style={style}
        key={`${testimonial.number}-${testimonial.name}`}
        onClick={() => {
          if (!isActive) setActiveIndex(index);
        }}
        role={!isActive ? "button" : undefined}
        tabIndex={!isActive ? 0 : undefined}
        aria-label={!isActive ? `Show testimonial ${index + 1}` : undefined}
        onKeyDown={(event) => {
          if (!isActive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setActiveIndex(index);
          }
        }}
      >
        <div className="collaboration-testimonials__card-head">
          <span>{testimonial.number}</span>
          {testimonial.featuredLabel && <span>{testimonial.featuredLabel}</span>}
        </div>

        <span className="collaboration-testimonials__quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote>{testimonial.quote}</blockquote>

        <div className="collaboration-testimonials__author">
          <div className="collaboration-testimonials__avatar" aria-hidden="true">
            <img src={testimonial.avatarUrl} alt="" />
            <span>{testimonial.initial}</span>
          </div>
          <div className="collaboration-testimonials__author-info">
            <strong>{testimonial.name}</strong>
            <span>{testimonial.role}</span>
            {testimonial.featured && <small>{testimonial.company}</small>}
          </div>
          {!testimonial.featured && (
            <small className="collaboration-testimonials__company">
              {testimonial.company}
            </small>
          )}
        </div>

        {testimonial.tags && (
          <div className="collaboration-testimonials__tags">
            {testimonial.tags.map((tag, tagIndex) => (
              <span key={tag}>
                {tagIndex > 0 && <i aria-hidden="true">/</i>}
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="collaboration-testimonials"
      className="collaboration-testimonials section-reveal"
      aria-labelledby="collaboration-testimonials-heading"
    >
      <div className="collaboration-testimonials__frame">
        <div className="collaboration-testimonials__top-rule" />

        <header>
          <div className="collaboration-testimonials__label" data-reveal="1">
            <span className="collaboration-testimonials__section-number">
              {collaborationTestimonials.sectionNumber}
            </span>
            <span className="collaboration-testimonials__label-rule" />
            <span>{collaborationTestimonials.sectionLabel}</span>
          </div>

          <div className="collaboration-testimonials__header-grid">
            <h2 id="collaboration-testimonials-heading" data-reveal="2">
              {collaborationTestimonials.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <div className="collaboration-testimonials__intro" data-reveal="3">
              <p>{collaborationTestimonials.intro}</p>
              <span>{collaborationTestimonials.perspectiveNote}</span>
            </div>
          </div>
        </header>

        <div
          className="collaboration-testimonials__cards"
          role="region"
          aria-label="Testimonials slider"
          tabIndex={0}
          onMouseEnter={() => setIsAutoPaused(true)}
          onMouseLeave={() => setIsAutoPaused(false)}
          onFocus={() => setIsAutoPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsAutoPaused(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") goToPrevious();
            if (event.key === "ArrowRight") goToNext();
          }}
        >
          <div className="collaboration-testimonials__slider-shell">
            <div className="collaboration-testimonials__slider-meta">
              <span>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(totalTestimonials).padStart(2, "0")}
              </span>
              <div className="collaboration-testimonials__slider-actions">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={!canSlide}
                  aria-label="Show previous testimonial"
                >
                  <ChevronLeft size={18} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={!canSlide}
                  aria-label="Show next testimonial"
                >
                  <ChevronRight size={18} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div
              className={`collaboration-testimonials__carousel-stage has-${visibleTestimonials.length}-cards`}
              key={activeIndex}
            >
              {visibleTestimonials.map(({ testimonial, index, position }) =>
                renderTestimonial(testimonial, index, position)
              )}
            </div>

            {canSlide && (
              <div className="collaboration-testimonials__dots" aria-label="Select testimonial">
                {testimonials.map((testimonial, index) => (
                  <button
                    key={`${testimonial.number}-${testimonial.name}-dot`}
                    type="button"
                    className={index === activeIndex ? "is-active" : ""}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show testimonial ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="collaboration-testimonials__principle" data-reveal="8">
          <div>
            <span>{collaborationTestimonials.principleLabel}</span>
            <p>{collaborationTestimonials.principle}</p>
          </div>
          <strong>{collaborationTestimonials.principleTags}</strong>
        </aside>

        <span className="collaboration-testimonials__watermark" aria-hidden="true">
          {collaborationTestimonials.sectionNumber}
        </span>
        <img
          className="collaboration-testimonials__ambient-dot"
          src={collaborationTestimonials.ambientDotUrl}
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
