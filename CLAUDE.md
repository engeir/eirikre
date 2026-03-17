# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multilingual personal website built with Hugo and the Hyas/Doks framework. It features blog posts, documentation, and project showcases in both English and Norwegian (Bokmål).

## Build Commands

**Development:**
```bash
npm run dev                # Start dev server (localhost:1313)
npm run dev:drafts        # Start dev server including draft content
```

**Production:**
```bash
npm run build             # Build for production (minified)
npm run preview           # Preview production build locally
```

**Content Management:**
```bash
npm run create <path>     # Create new content (e.g., npm run create blog/my-post/index.md)
```

**Linting:**
```bash
npm run lint              # Run all linters
npm run lint:scripts      # Lint JavaScript files
npm run lint:styles       # Lint SCSS files
npm run lint:markdown     # Lint markdown files
```

**Cleanup:**
```bash
npm run clean             # Clean all generated files
npm run clean:build       # Remove public/, resources/, and .hugo_build.lock
npm run clean:lint        # Remove lint cache files
```

## Architecture

### Hugo + Hyas/Doks Framework

This project uses Hugo (v0.123.7) extended edition with the Hyas/Doks-core framework, which provides a modern documentation and blog theme with extensive features.

**Key Dependencies:**
- `@hyas/doks-core` - Core Doks theme functionality
- `@hyas/images` - Image processing and optimization
- `@hyas/inline-svg` - SVG icon support (uses Tabler Icons)
- `@hyas/seo` - SEO and meta tags

### Directory Structure

- `content/` - Markdown content files organized by type (blog/, posts/, docs/)
- `layouts/` - Hugo template overrides (extends Doks-core templates via module mounts)
- `assets/` - SCSS, JavaScript, and processable assets
- `static/` - Static files copied as-is (fonts, favicons)
- `config/` - Hugo configuration split by environment (_default/, production/, next/)
- `data/` - Data files for Hugo templates
- `i18n/` - Translation strings

### Module Mount System

The project uses Hugo's module mount system defined in `config/_default/module.toml`. Templates and assets from npm packages (@hyas/* modules) are mounted into the Hugo filesystem, allowing selective overrides in the local directories.

### Multilingual Setup

- Default language: English (en)
- Secondary language: Norwegian Bokmål (nb)
- Content organized with language codes: `content/en/`, `content/nb/`
- Language-specific configs in `config/_default/languages.toml`
- Separate menu configurations per language in `config/_default/menus/`

### Content Types

- **Blog** (`/blog/`) - Timestamped blog posts with year/month in URL
- **Posts** (`/posts/`) - Projects and standalone articles with slug-based URLs
- **Docs** (`/docs/`) - Documentation pages (currently placeholder content)
- **Categories & Tags** - Taxonomies for content organization

### Build & Deployment

- Deployed on Netlify (configuration in `netlify.toml`)
- Build command: `pnpm build`
- Hugo extended required for SCSS compilation
- Node 18.16.1+ and pnpm 8.10.0+ required
- Uses `exec-bin` and `hugo-installer` to manage Hugo binary

### Styling

- Bootstrap-based framework from Doks
- Custom SCSS in `assets/scss/common/`
- Main overrides in `_variables-custom.scss` and `_custom.scss`
- Supports dark/light mode toggle (configured in params.toml)

### Search

- FlexSearch enabled for client-side search
- Search index generated at build time (`search-index.json` output format)
- Configured in `config/_default/hugo.toml` outputs section

### Key Configuration Files

- `config/_default/hugo.toml` - Main Hugo settings, permalinks, taxonomies
- `config/_default/params.toml` - Doks theme configuration (navbar, search, SEO)
- `config/_default/module.toml` - Module mounts for @hyas packages
- `config/_default/languages.toml` - Multilingual configuration
- `config/postcss.config.js` - PostCSS for CSS processing
- `config/babel.config.js` - Babel for JavaScript transpilation

### Content Creation Notes

When creating new content:
- Blog posts: Place in `content/blog/` with date-based structure
- Project posts: Place in `content/posts/` as page bundles (index.md + images)
- Support both English and Norwegian versions (index.md and index.nb.md)
- Use Hugo page bundles for posts with images (folder with index.md)

### Package Manager

This project uses **pnpm** (not npm). The package manager is enforced via `packageManager` field in package.json.
