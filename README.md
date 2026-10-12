# ReverseBuilder ⚡
> Website Reverse Engineering and Visual Rebuilding Platform

ReverseBuilder helps engineers, founders, and designers turn any website reference (URL or uploaded screenshot) into an editable visual layout, and export clean, production-ready, zero-dependency HTML5 and CSS.

---

## 🌟 Key Capabilities

1. **URL Reverse Engineering**:
   - Automated crawler powered by an isolated Playwright browser context.
   - Extracts page typography, headings (H1-H3), brand colors, navigation links, and section layouts.
   - Strict SSRF (Server-Side Request Forgery) protection blocking private subnets, loopbacks, and cloud metadata endpoints.
   - Graceful fallback crawler when headless browser is restricted.

2. **Screenshot Reconstruction**:
   - Accepts PNG, JPEG, and WebP references up to 15MB.
   - Dual-mode analysis: Vision AI model integration (Gemini 1.5 / OpenAI) when an API key is present.
   - Intelligent Heuristic Reconstruction Engine when operating without external AI keys.

3. **Visual Live Editor**:
   - 12 modular component primitives: Navbar, Hero, Feature Cards, Stats, Testimonials, Pricing Tables, Contact Form, CTA Banner, Footer, Text Block, Image Block, and Card Grid.
   - Real-time live preview with immediate CSS custom property updates.
   - Inline direct text editing (double-click headings or text directly on canvas).
   - Multi-viewport switcher: Desktop (1200px), Tablet (768px), and Mobile (375px).
   - Undo and Redo engine (`Ctrl+Z`, `Ctrl+Y`).
   - Side-by-side reference drawer to compare reconstructions against original screenshots.

4. **Production Code Export**:
   - Generates and downloads an unbundled ZIP package containing:
     - `index.html`: Semantic HTML5, accessible ARIA roles, modern meta tags.
     - `styles.css`: Pure CSS utilizing CSS custom properties, Flexbox, and CSS Grid. Zero frameworks or runtime overhead.
     - `script.js`: Vanilla JavaScript powering mobile navigation toggles, smooth anchor scrolling, and contact form handling.
     - `README.md`: Quickstart guide for running locally.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Fetch API.
- **Backend**: Node.js, Express.js, REST APIs.
- **Storage**: Modular Atomic File Store (`server/storage/file-store.js`).
- **Browser Automation**: Playwright Chromium.
- **Packaging**: JSZip.
- **Testing**: Built-in Node.js Test Runner (`node:test`, `node:assert`).

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
cd reversebuilder
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Provide `GEMINI_API_KEY` or `OPENAI_API_KEY` to activate AI Vision screenshot classification. If omitted, ReverseBuilder automatically operates in Heuristic Reconstruction Mode).*

### 3. Run the Server
```bash
npm start
```
The application will be active at:
👉 **http://localhost:3000**

---

## 🧪 Running Automated Tests

Run the complete test suite (SSRF safety, JSON AST validation, atomic file storage, ZIP packaging, and REST APIs):
```bash
npm test
```

All 34 test cases will execute and verify the integrity of the platform.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and feature capability flags |
| `GET` | `/api/projects` | List stored projects with search and sorting |
| `POST` | `/api/projects` | Create a blank project or clone a template |
| `GET` | `/api/projects/:id` | Fetch full project AST by ID |
| `PATCH` | `/api/projects/:id` | Save updates to sections, properties, and styles |
| `POST` | `/api/projects/:id/duplicate` | Duplicate an existing project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `POST` | `/api/projects/:id/export` | Download complete project as a ZIP archive |
| `POST` | `/api/import/url` | SSRF-checked URL crawl and reverse engineering |
| `POST` | `/api/import/screenshot` | Multipart screenshot upload and reconstruction |
| `POST` | `/api/import/asset` | Upload user images for custom sections |
| `GET` | `/api/templates` | Retrieve the 5 pre-built production templates |

---

## 🛡️ Security Architecture

- **SSRF Protection**: Validates protocols (HTTP/HTTPS only), resolves DNS before requests, and blocks IPv4/IPv6 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`).
- **Input Sanitization**: All text nodes are escaped before injection into DOM/export to mitigate XSS vectors.
- **Atomic File Writing**: File writes use temporary `.tmp` files with atomic renames to avoid corruption during concurrent operations.
- **Directory Traversal Guard**: Project IDs are strictly validated with regex `^[a-zA-Z0-9_-]+$`.

---

## 📄 License
MIT © 2026 ReverseBuilder Team.
