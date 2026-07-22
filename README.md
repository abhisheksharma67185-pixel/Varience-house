# Variance House

A responsive, dependency-free editorial experience for the September 2026 Variance House residency in Bangalore.

## Preview locally

Run the local static server:

```bash
npm run dev
```

Then visit `http://localhost:4173`.

## Verification and production output

```bash
npm run lint
npm run typecheck
npm run build
```

The build script copies the verified static site to `dist/`. The hero smoke is a dependency-free volumetric WebGL shader (raymarched noise, left-to-right flow) with an automatic Canvas 2D fallback; reduced-motion preferences disable non-essential movement.

## Before launch

The interest form is a front-end prototype and deliberately stores no data. Connect it to the final application endpoint and replace placeholder social links before publishing.
