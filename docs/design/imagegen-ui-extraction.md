# Imagegen UI Reference Extraction

Reference image: `docs/design/imagegen-ui-reference-home.png`

Home redesign reference: `docs/design/imagegen-home-redesign-reference.png`

## Keep

- Wood table and linen tabletop mood.
- Cream paper panel with fine brown borders.
- Deep green primary action with tactile depth.
- Face-down green cards remain useful for round screens, not for the Home entry surface.
- Slim order track and wooden life tokens are historical board-game cues, not current Home UI.
- Muted vermilion and brass accents.

## Adapt

- Use CSS gradients, shadows, borders, and simple shapes instead of shipping a photographic background.
- Keep all Japanese text as real HTML text.
- Apply the same material language to every screen through shared components.
- Use compact mobile-safe spacing rather than copying the dense mockup exactly.

## Reject

- Fine decorative handwritten notes that would reduce readability.
- Complex overlapping props near controls.
- Any generated text shape as a source of truth.

## Implementation Notes

- `Layout` owns the table and linen background.
- `CardSurface` becomes the shared paper board surface.
- `PrimaryButton` becomes a tactile board-game button.
- `HomeScreen` gets the strongest tabletop composition through the title placard, felt ribbon, brass accents, and three entry buttons.
- Other screens inherit the same paper, border, color, and button treatment.

## Home Redesign

### Keep

- Title placard as the largest first-viewport signal.
- Deep green primary CTA and quieter paper secondary actions.
- Warm wood, linen, brass edge, and vermilion accent materials.

### Adapt

- Use CSS borders, paper shadows, a felt ribbon, and small corner details instead of photo-real props.
- Keep the screen focused on the entry actions instead of showing a current hand.

### Reject

- Sample card labels `1枚目` / `2枚目` on Home.
- Life tokens and order-track decoration on Home.
- Generated props that compete with the title or CTA.
