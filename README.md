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

The build script copies the verified static site to `dist/`. The experience intentionally uses CSS 3D and Canvas 2D rather than a heavy 3D dependency; reduced-motion preferences disable non-essential movement.

## Before launch

The interest form is a front-end prototype and deliberately stores no data. Connect it to the final application endpoint and replace placeholder social links before publishing.
