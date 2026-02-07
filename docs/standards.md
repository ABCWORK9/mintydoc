# MintyDoc Frontend Standards

## Tailwind Guardrails
- Do not use arbitrary values like `w-[...]`, `text-[...]`, `mt-[...]`, `px-[...]`.
- Use layout primitives (`Container`, `Stack`) and design tokens (CSS variables + Tailwind theme) only.

## Source of Truth
- Tokens live in `src/app/globals.css` and are referenced through Tailwind theme mappings.
- If you need a new value, add it as a token first.
