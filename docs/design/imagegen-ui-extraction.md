# Imagegen UI Reference Extraction

Reference image: `docs/design/imagegen-ui-reference-home.png`

## Keep

- Wood table and linen tabletop mood.
- Cream paper panel with fine brown borders.
- Deep green primary action with tactile depth.
- Face-down green cards and small 1枚目 / 2枚目 labels.
- Slim order track and wooden life tokens as board-game cues.
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
- `HomeScreen` gets the strongest tabletop composition: title placard, card backs, order track, life tokens, and three entry buttons.
- Other screens inherit the same paper, border, color, and button treatment.
