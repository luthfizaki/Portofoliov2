import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { useContent } from "../context/ContentContext";

const mobileIntroEnding = " that turn complex ideas into clear and meaningful experiences.";

export function ContactFinalStatementSection() {
  const { contactFinalStatement } = useContent();
  const sectionRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("contact-final-is-visible", entry.isIntersecting);
        section.classList.toggle("section-is-visible", entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.classList.remove("contact-final-is-visible");
    };
  }, []);

  const backToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { lerp: 0.09 });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="contact-final section-reveal"
      aria-labelledby="contact-final-heading"
    >
      <div className="contact-final__frame">
        {contactFinalStatement.ambientOrbUrl && (
          <img
            className="contact-final__ambient-orb"
            src={contactFinalStatement.ambientOrbUrl}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="contact-final__top-rule" />

        <header>
          <div className="contact-final__label" data-reveal="1">
            <span className="contact-final__section-number">
              {contactFinalStatement.sectionNumber}
            </span>
            <span className="contact-final__label-rule" />
            <span className="contact-final__label-desktop">
              {contactFinalStatement.sectionLabel}
            </span>
            <span className="contact-final__label-mobile">CONTACT</span>
          </div>

          <div className="contact-final__header-grid">
            <h2 id="contact-final-heading" data-reveal="2">
              {contactFinalStatement.headlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>

            <div className="contact-final__intro" data-reveal="3">
              <p>
                {contactFinalStatement.intro.endsWith(mobileIntroEnding)
                  ? contactFinalStatement.intro.slice(0, -mobileIntroEnding.length)
                  : contactFinalStatement.intro}
                <span className="contact-final__intro-mobile-period">.</span>
                <span className="contact-final__intro-desktop-ending">
                  {contactFinalStatement.intro.endsWith(mobileIntroEnding)
                    ? mobileIntroEnding
                    : ""}
                </span>
              </p>
              <div className="contact-final__availability">
                {contactFinalStatement.availabilityDotUrl && <img src={contactFinalStatement.availabilityDotUrl} alt="" />}
                <span>{contactFinalStatement.availabilityLabel}</span>
                <strong>{contactFinalStatement.availabilityLocation}</strong>
              </div>
            </div>
          </div>
        </header>

        <nav className="contact-final__links" aria-label="Contact and profile links">
          {contactFinalStatement.links.map((link) => {
            const content = (
              <>
                <span className={`contact-final__link-number is-${link.accent}`}>
                  {link.number}
                </span>
                <span className="contact-final__link-label">{link.label}</span>
                <span className="contact-final__link-arrow" aria-hidden="true">
                  ↗
                </span>
                <strong>{link.title}</strong>
                <small>{link.detail}</small>
              </>
            );

            return !link.url || link.url === "#contact" ? (
              <button
                type="button"
                className="contact-final__link"
                key={link.number}
                onClick={() => window.alert("Resume link will be available soon.")}
                aria-label={`${link.title} - coming soon`}
              >
                {content}
              </button>
            ) : (
              <a
                className="contact-final__link"
                href={link.url}
                key={link.number}
                target={link.openInNewTab ? "_blank" : undefined}
                rel={link.openInNewTab ? "noreferrer" : undefined}
              >
                {content}
              </a>
            );
          })}
        </nav>

        <div className="contact-final__open-to" data-reveal="8">
          <span>{contactFinalStatement.openToLabel}</span>
          <p>{contactFinalStatement.openTo}</p>
        </div>

        <footer className="contact-final__footer">
          <span>{contactFinalStatement.copyright}</span>
          <span>{contactFinalStatement.footerStatement}</span>
          <button type="button" onClick={backToTop}>
            {contactFinalStatement.backToTopLabel}
          </button>
        </footer>

        <span className="contact-final__watermark" aria-hidden="true">
          {contactFinalStatement.sectionNumber}
        </span>
      </div>
    </section>
  );
}
