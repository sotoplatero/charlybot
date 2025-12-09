# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application using Svelte 5, built with Vite and pnpm as the package manager.

## Commands

### Development
- `pnpm dev` - Start development server
- `pnpm dev -- --open` - Start development server and open in browser
- `pnpm prepare` - Sync SvelteKit generated files

### Building
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build locally

### Type Checking
- `pnpm check` - Run svelte-check for type checking
- `pnpm check:watch` - Run svelte-check in watch mode

## Project Structure

- `src/routes/` - SvelteKit file-based routing
  - `+page.svelte` - Page components
  - `+layout.svelte` - Layout components
- `src/lib/` - Reusable components and utilities (aliased as `$lib`)
- `src/app.html` - HTML template shell
- `src/app.d.ts` - TypeScript ambient declarations for SvelteKit types
- `static/` - Static assets served from root

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5.x (uses runes: `$props()`, `$state()`, etc.)
- **Build Tool**: Vite 7.x
- **Language**: JavaScript with JSDoc type checking enabled
- **Package Manager**: pnpm (note: uses `onlyBuiltDependencies` for esbuild)

## Important Notes

- This project uses **Svelte 5** which has a different API than Svelte 4:
  - Use runes (`$props()`, `$state()`, `$derived()`, `$effect()`) instead of `export let`
  - Use `{@render children()}` instead of `<slot>`
- JavaScript is used with JSDoc, not TypeScript (jsconfig.json with checkJs enabled)
- The adapter is set to `adapter-auto` which auto-detects deployment platform
- TypeScript checking is configured via jsconfig.json extending `.svelte-kit/tsconfig.json`
