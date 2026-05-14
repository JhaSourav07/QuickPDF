
<div align="center">

# QuickPDF

> PDF tools that respect your privacy — merge and split documents entirely in the browser.



[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pdf-lib](https://img.shields.io/badge/pdf--lib-1.17-FF0000?style=flat-square)](https://pdf-lib.js.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/jhasourav07/quickpdf/pulls)
[![Netlify Status](https://api.netlify.com/api/v1/badges/b4fa8a5d-0510-4b09-a5a6-b043ffcf4691/deploy-status)](https://app.netlify.com/projects/quickstpdf/deploys)
[![CI Pipeline](https://github.com/jhasourav07/quickpdf/actions/workflows/ci.yml/badge.svg)](https://github.com/jhasourav07/quickpdf/actions/workflows/ci.yml)

**[🚀 Try the Live Demo Here](https://quickpdff.vercel.app/)**
</div>
---

Every major PDF tool — Smallpdf, ILovePDF, Adobe Acrobat Online — routes your files through a remote server. You upload a confidential contract, a financial statement, a medical record — and it passes through infrastructure you don't control.

**QuickPDF is different.** It processes everything 100% client-side using `pdf-lib` in the browser. Your files never leave your device. Not for a millisecond. No backend. No uploads. No data liability.

---

## Features

- **Merge PDFs** — Combine unlimited PDFs with drag-and-drop reordering
- **Split PDFs** — Extract any page range with start/end page precision  
- **Zero uploads** — All processing happens in-memory in your browser via WebAssembly
- **No watermarks** — Clean, unbranded output on every export
- **Instant** — No network round-trips; operations complete in milliseconds
- **Fully responsive** — Works on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| PDF Engine | pdf-lib 1.17 (client-side / WASM) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion 12 |
| Routing | React Router 7 |
| Icons | Lucide React |

---

## Screenshots

<img width="1906" height="944" alt="Screenshot 2026-03-26 023302" src="https://github.com/user-attachments/assets/bfb35bf5-e7cb-49ef-8c78-1d8cb55cd762" />
<img width="1905" height="941" alt="Screenshot 2026-03-26 023335" src="https://github.com/user-attachments/assets/c876a538-22f3-4821-b28c-ce9bd832c55b" />
<img width="1902" height="944" alt="Screenshot 2026-03-26 023512" src="https://github.com/user-attachments/assets/c9269365-fe15-4080-9433-dfe1cadbb676" />
<img width="1891" height="923" alt="Screenshot 2026-03-26 023607" src="https://github.com/user-attachments/assets/6ea8d217-9c91-447a-80c2-8a9b328835ef" />

---

## Getting Started

**Prerequisites:** Node.js v22+ (LTS)

```bash
# Clone the repo
git clone https://github.com/jhasourav07/quickpdf.git
cd quickpdf

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

The `dist/` output is fully static — deploy to Vercel, Netlify, or Cloudflare Pages with zero configuration.

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              # Sticky top navigation
│   │   └── PageContainer.jsx       # Page layout wrapper
│   ├── pdf/
│   │   └── Dropzone.jsx            # Drag-and-drop file input
│   └── ui/
│       ├── AnimatedBackground.jsx  # Mouse-reactive background
│       └── Button.jsx              # Reusable button component
├── pages/
│   ├── Home/                       # Landing page
│   ├── Merge/                      # Multi-file merge tool
│   └── Split/                      # Page-range split tool
├── services/
│   └── pdf.service.js              # Core PDF logic (merge, split, page count)
└── utils/
    └── formatters.js               # File size helpers
```

---

## How It Works

QuickPDF uses [`pdf-lib`](https://pdf-lib.js.org/) — a pure JavaScript library that runs entirely in the browser with no server dependency.

**Merging**

1. Files are read as `ArrayBuffer` via the browser's native File API
2. Each PDF is loaded into a `PDFDocument` instance in memory
3. Pages are copied into a new document in the user-defined drag order
4. The merged document is serialized and triggered as a browser download — never transmitted anywhere

**Splitting**

1. User uploads a PDF; page count is extracted immediately in-memory
2. User specifies start and end pages
3. Only the selected page range is copied into a new `PDFDocument`
4. Output is downloaded directly — the original file is never modified

---

## Roadmap

- [ ] Sign PDF — Local, private e-signature drawing tool
- [ ] Add Page Numbers — Auto-stamp sequential numbers on footers
- [ ] Extract Text (OCR) — Pull readable text directly to clipboard
- [ ] Protect/Unlock PDF — Add or remove passwords locally
- [ ] Edit PDF - Edit PDF locally on your browser

---
## 🧪 Use Cases

- Invoice generation  
- Automated reports  
- Web page archiving  
- Email attachments  
- Competitor monitoring  
- Compliance documentation  

---

## 🏗️ System Architecture

Client → API Gateway → Headless Chrome Renderer → PDF Generator → Response  

---

## 📈 Performance

- Fast Chrome-based rendering  
- Batch processing support  
- Stateless architecture  
- Designed for production-scale workloads  

---

## 🔐 Security

- API key authentication  
- Rate limiting  
- SSRF protection  
- Isolated execution environment  
- HTTPS enforced  

---

## 📊 Comparison

| Tool | Limitation | QuickPDF Advantage |
|------|-----------|--------------------|
| Puppeteer | Complex setup | API-first simplicity |
| wkhtmltopdf | Outdated rendering | Modern Chrome engine |
| Custom scripts | Hard to scale | Fully managed service |
---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit message format.

---

## Security

QuickPDF is architected so that a breach of the application itself **cannot expose user files** — because files are never transmitted. The attack surface is limited entirely to the user's own browser session.

If you discover a vulnerability, please open a [GitHub Security Advisory](https://github.com/jhasourav07/quickpdf/security/advisories/new) rather than a public issue.

---
## Philosophy

QuickPDF is built as production-grade rendering infrastructure focused on:

- Reliability
- Scalability
- Developer experience

## License

MIT © [Sourav Jha](https://github.com/jhasourav07)


### This project is an official participant in Nexus Spring of Code (NSoC) 2026.
