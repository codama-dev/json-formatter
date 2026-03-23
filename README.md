# Free JSON Formatter & Validator

A fast, free, and open-source JSON formatter, validator, and minifier that runs entirely in your browser. No data is sent to any server.

**[Use it now - free-json-formatter.codama.dev](https://free-json-formatter.codama.dev/)**

## Features

- **Format & Beautify** - Pretty-print JSON with configurable indentation (2 spaces, 4 spaces, or tabs)
- **Minify** - Compress JSON by removing all whitespace
- **Validate** - Check JSON syntax with detailed error messages (line and column)
- **Tree View** - Explore JSON structure with a collapsible, color-coded tree
- **Copy & Download** - One-click copy to clipboard or download as `.json`
- **Dark Mode** - Automatic light/dark theme based on system preference
- **Multi-language** - Available in English, German, Spanish, and Hebrew (RTL supported)
- **100% Client-side** - Your data never leaves your browser
- **No Signup** - No account, no tracking beyond basic analytics, no limits

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (Radix primitives) |
| i18n | react-i18next |
| Hosting | Cloudflare Pages |
| Analytics | Google Analytics 4 |

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Format & lint
pnpm format
```

## Project Structure

```
src/
  pages/
    ToolPage.tsx      # Main JSON formatter UI
    PageHeader.tsx    # Orange gradient hero
    PageFooter.tsx    # Codama branding + cross-tool links
    AboutPage.tsx     # Codama services page
  components/
    ShareModal.tsx    # Social sharing after first use
    ui/               # shadcn/ui components
  lib/
    tool-config.ts    # Tool name, URL, config
    analytics.ts      # GA4 setup
  locales/            # i18n translations (en, de, es, he)
```

## More Free Tools by Codama

| Tool | URL |
|---|---|
| QR Code Generator | [free-qr-code.codama.dev](https://free-qr-code.codama.dev/) |
| JSON Formatter | [free-json-formatter.codama.dev](https://free-json-formatter.codama.dev/) |

More tools coming soon. All free, all open source.

## Built by Codama

[Codama](https://codama.dev) is a software agency that builds web apps, mobile apps, automation, AI integrations, and data solutions.

Need something built? [Get a quote](https://codama.dev/#colophon)

## License

MIT
