# Phase 1 Asset Manifest

Production artwork is stored in `apps/mobile/assets/`. Raster assets use PNG with transparency. Mascot exports are
720×960 px (3× the `xl` 240×320 pt display frame); environmental artwork is 960 px on its longest edge and designed for
at least a 320×240 pt presentation. All assets are local and bundled; no remote URLs or government marks are used.

## Fatih Abi states

| File                                                  | State                      | Intended use                      | Status |
| ----------------------------------------------------- | -------------------------- | --------------------------------- | ------ |
| `apps/mobile/assets/mascot/fatih-abi-welcome.png`     | Welcome, wave              | First-use greeting                | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-happy.png`       | Happy, smile and thumbs-up | Positive feedback                 | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-proud.png`       | Proud, arms crossed        | Acknowledgement                   | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-celebrating.png` | Celebrating, arms raised   | User milestone                    | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-thinking.png`    | Thinking, hand at chin     | Helpful tips                      | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-explaining.png`  | Explaining, open hand      | Onboarding or privacy explanation | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-encouraging.png` | Encouraging, hand extended | Empty states and motivation       | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-concerned.png`   | Concerned, hand over chest | Caring environmental context      | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-neutral.png`     | Neutral, relaxed stance    | Default and idle state            | Ready  |
| `apps/mobile/assets/mascot/fatih-abi-success.png`     | Success, thumbs-up         | Submission acknowledgement        | Ready  |

`apps/mobile/assets/mascot/source/fatih-abi-reference-sheet.png` is an opaque concept reference; do not render it as a
transparent in-app asset.

## Environmental illustrations

| File                                                           | Registry key        | Intended use                           |
| -------------------------------------------------------------- | ------------------- | -------------------------------------- |
| `apps/mobile/assets/illustrations/empty-feed-neighborhood.png` | `empty-feed`        | Empty feed / neighborhood introduction |
| `apps/mobile/assets/illustrations/community-sapling.png`       | `community-sapling` | Community care and positive impact     |

The generated scenes are illustrative brand artwork. They are not photographs or evidence of a real cleanup or public
institutional outcome.

## Component registry

- Mascot states: `apps/mobile/src/features/brand/mascotRegistry.ts`
- Mascot display: `apps/mobile/src/features/brand/MascotSlot.tsx`
- Illustration registry: `apps/mobile/src/features/brand/illustrationRegistry.ts`
- Illustration display: `apps/mobile/src/features/brand/IllustrationSlot.tsx`
- In-app visual catalog: `apps/mobile/app/index.tsx`

Files were generated as individual image assets with ImageGen using the welcome artwork as a reference for pose
consistency, then resized to their documented mobile output dimensions while preserving alpha transparency.
