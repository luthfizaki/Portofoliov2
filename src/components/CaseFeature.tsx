export type CaseFeatureImage = {
  url: string;
  alt?: string;
};

export type CaseFeatureProps = {
  eyebrow: string;
  titleLines: string[];
  description: string;
  platform: string;
  scope: string;
  images: CaseFeatureImage[];
  layout: "media-left" | "media-right";
};

export function CaseFeature({ eyebrow, titleLines, description, platform, scope, images, layout }: CaseFeatureProps) {
  const isMediaLeft = layout === "media-left";
  const imageCount = Math.min(images.length, 4);

  return (
    <section className={`case-feature ${isMediaLeft ? "is-media-left" : "is-media-right"}`} aria-labelledby="case-feature-heading">
      <div className="case-study__container">
        <div className="case-study__rule" />
        <div className="case-feature__grid">
          <div className="case-feature__copy">
            <span className="case-feature__eyebrow">{eyebrow}</span>
            <h2 id="case-feature-heading">{titleLines.map((line) => <span key={line}>{line}</span>)}</h2>
            <p className="case-feature__description">{description}</p>
            <dl className="case-feature__details">
              <div><dt>PLATFORM</dt><dd>{platform}</dd></div>
              <div><dt>SCOPE</dt><dd>{scope}</dd></div>
            </dl>
          </div>
          <div className="case-feature__visual-shell">
            <div className={`case-feature__images case-feature__images--${imageCount}`}>
              {images.map((image, index) => (
                <figure className="case-feature__image" key={`${image.url}-${image.alt ?? ""}-${index}`}>
                  <img src={image.url} alt={image.alt ?? ""} loading="lazy" decoding="async" />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
