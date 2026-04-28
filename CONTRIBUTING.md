# Contributing to ShowHive

Thank you for your interest in contributing to ShowHive! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** and clone it locally:

   ```bash
   git clone <your-fork-url>
   cd show-hive
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase and Google Calendar credentials

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

## Code Standards

- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Code formatting**: Prettier (use `.prettierrc` config)
- **Component structure**: React 19 Server/Client Components

### Before submitting a PR:

1. **Type-check**: Ensure TypeScript compiles without errors

   ```bash
   pnpm build
   ```

2. **Format code** (optional, but recommended):

   ```bash
   pnpm exec prettier --write .
   ```

3. **Test the changes**: Verify the app runs and your changes work as expected

## Commit Message Guidelines

Use clear, descriptive commit messages:

- `feat: add feature description`
- `fix: fix bug description`
- `docs: update documentation`
- `refactor: refactor code section`
- `test: add tests`

## Pull Request Process

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes with clear commit messages

3. Push to your fork and open a PR with:
   - Clear title describing the change
   - Description of what changed and why
   - Link to any related issues

4. Ensure all TypeScript checks pass

## Project Structure

See `README.md` for the full project structure. Key directories:

- `app/` — Next.js App Router pages and API routes
- `components/` — React components
- `lib/` — Utilities, Supabase clients, Google Calendar helpers
- `types/` — TypeScript type definitions

## Questions?

Feel free to open an issue or ask in the PR discussion!
