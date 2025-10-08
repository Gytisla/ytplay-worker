UI & Design — YouTube Fetcher Worker (Public App)

Purpose
- Provide concrete Tailwind-based UI examples, theme selector behavior, and animation/UX guidance for implementers building the public-facing discovery site.

Branding & Constraints
- Keep branding minimal and original; avoid copying YouTube or Netflix trademarked UI elements.
- Focus on clarity, whitespace, and strong visual hierarchy.

Header / Theme Selector (recommended structure)
- Header contains: left-aligned brand mark, centered (or right) search box, right-aligned controls: theme toggle, hamburger/menu for small screens.
- Theme toggle behavior:
  - Uses `class="dark"` on `html` (Tailwind class-based dark mode).
  - Toggle writes `theme=dark|light|system` to localStorage (key: `ytplay_theme`).
  - Default: `system` (honor `prefers-color-scheme` until user chooses)
  - Example JS (simplified):
    - read stored value, if none and system=dark then add `dark` class, else remove.
    - on toggle, set localStorage and update DOM class.

Tailwind Component Examples
- Card (video preview)
  - Wrapper: `relative rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg transition-transform transform hover:-translate-y-1`
  - Thumbnail: `w-full aspect-[16/9] object-cover bg-gray-100 dark:bg-gray-800`
  - Meta: `p-3 flex items-start gap-3`
  - Title: `text-base font-semibold text-gray-900 dark:text-gray-50 truncate`
  - Channel: `text-sm text-muted dark:text-gray-300`
  - Stats row: `text-xs text-muted` with chip-like badges `bg-muted/10 px-2 py-0.5 rounded-full`

- Grid layout
  - Container: `grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
  - Use CSS to maintain consistent card heights or use `line-clamp` for titles.

- Skeleton loader
  - `animate-pulse bg-gray-200 dark:bg-gray-800 rounded` with appropriate aspect ratio.

Animations & Motion
- Use small entrance animations: `animate-fade-in` with CSS keyframes; prefer `transition` utilities for hover interactions.
- Respect reduced motion: wrap animation classes with `motion-safe:` or check `prefers-reduced-motion`.

Accessibility
- All images must include descriptive `alt` text.
- Ensure focus-visible styles using `focus:outline-none focus:ring-2 focus:ring-offset-2`.
- Use semantic elements: `button`, `a`, `header`, `main`, `nav`.

Example Header (conceptual markup)
- Header (desktop)
  - left: brand (link)
  - center: search input (`input[type=search]` with aria label)
  - right: theme toggle button (aria-pressed) and menu

Persistence & Progressive Enhancement
- Theme persists via localStorage and falls back to system preference.
- Provide server-rendered default theme class on SSR when possible (based on cookie) to avoid flash-of-unstyled-theme (FOUT).

Open Graph & SEO
- Provide SSR meta tags for landing page and category pages for social previews.
- Include canonical links and proper robots directives for non-indexed pages.

Colors & Tokens (recommended palette samples)
- Primary: `#0EA5A4` (teal-500) or project-specific primary
- Surface (light): `#ffffff`, muted text `#6B7280`
- Surface (dark): `#0F172A`, muted text `#9CA3AF`

Implementation notes
- Prefer small, composable components and Tailwind `@apply` in component CSS if needed.
- Keep initial payload light: list endpoints should return thumbnails, truncated titles, channel name, and an API link for full detail.

Examples to ship
- Landing page with 3 sections: New (most recent), Trending (score), Top (aggregate stat)
- Category page: top videos by category with filters and sort
- Channel listing: card grid with pagination/infinite scroll
- Video detail: modal with metadata and links to source



