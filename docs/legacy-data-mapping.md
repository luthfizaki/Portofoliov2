# Legacy Data Mapping

Source snapshot: `legacy-cms-backup/data/`

| Legacy source | Current shape | Target model | Migration handling |
| --- | --- | --- | --- |
| `hero.json` | Hero content object | `PageSection` | Stored as the `hero` homepage section. |
| `about.json` | About content object | `PageSection` | Stored as the `about` homepage section. |
| `experience.json` | Section metadata + rows | `PageSection`, later `Experience` | Kept as a section first; row normalization is Phase 5. |
| `selected-work.json` | Section content | `PageSection` | Stored as the `selected-work` section. |
| `flagship-products.json` | Section metadata + projects | `PageSection`, `Project`, `ProjectBlock` | Projects become draft records and receive a `HERO` block. |
| `creative-practice.json` | Section content + cards | `PageSection` | Cards stay in JSONB initially. |
| `project-archive.json` | Archive rows | `PageSection`, later `Project` | Kept as source section until project metadata is normalized. |
| `how-i-work.json` | Section content + steps | `PageSection` | Stored as the `how-i-work` section. |
| `capabilities-tools.json` | Capabilities + tools | `PageSection`, later `Skill` | Kept as a section until the taxonomy is approved. |
| `collaboration-testimonials.json` | Testimonials + section content | `PageSection`, later `Testimonial` | Visual copy is preserved before normalization. |
| `contact-final-statement.json` | Contact content | `PageSection`, `SiteSetting` | Profile values migrate after the setting model is approved. |

The importer is additive: it creates draft records without altering the current Express tables or JSON source files.
