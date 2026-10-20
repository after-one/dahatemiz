# Fatih Abi Mascot Guide

Fatih Abi is a fictional, friendly neighborhood sanitation worker and environmental guide. The artwork treats sanitation
work with dignity and warmth. It carries no municipal marks and does not imply institutional endorsement.

## Character anchors

- Middle-aged man with short dark hair, a neat moustache and beard, and an olive work cap.
- Forest-green workwear, mustard high-visibility vest with neutral reflective bands, cream gloves, and brown work boots.
- Human proportions and calm expressions; no superhero, childlike, or mocking traits.
- Premium editorial ink contours with a restrained gouache surface.
- Transparent full-body portrait artwork with a consistent 3:4 canvas and clear silhouette.

## Use in the app

Use `MascotSlot` from `apps/mobile/src/features/brand/MascotSlot.tsx`. Every instance must provide an accessible
description. Choose the expression to fit the message, keep reporting and privacy messages neutral, and reserve
celebration for user participation or positive community action. Never imply that a report proves wrongdoing or that a
public institution has resolved it.

Supported states are `welcome`, `happy`, `proud`, `celebrating`, `thinking`, `explaining`, `encouraging`, `concerned`,
`neutral`, and `success`. Supported display sizes are `sm`, `md`, `lg`, and `xl`; the registry can replace a state asset
without changing screen consumers. There is no animation yet. Rive/Lottie can be added behind the same component API in
a later phase.

## Creation notes

Each production pose was generated from the welcome image as the canonical visual reference, with a separate pose and
expression prompt. Keep the reference image attached when creating future variants; preserve the face, clothing, line
weight, canvas, palette, and lighting. Review transparency and legibility on both light and dark surfaces before adding
new states to the registry.

The original reference sheet is retained under `apps/mobile/assets/mascot/source/`. It is a concept record, not a
production compositing asset. Production state files live directly under `apps/mobile/assets/mascot/`.
