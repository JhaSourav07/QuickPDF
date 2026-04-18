const SITE_NAME = "QuickPDF";
const SITE_URL = "https://quickpdff.vercel.app";

const DEFAULT_SEO = {
  title: "QuickPDF — Free Online PDF Tools (Private, Browser-Based)",
  description:
    "QuickPDF is a free browser-based PDF toolkit to merge, split, compress, rotate, watermark, and edit PDF files privately on your device.",
  keywords:
    "QuickPDF, PDF tools, merge PDF, split PDF, compress PDF, rotate PDF, edit PDF, watermark PDF, PDF to image, image to PDF",
  robots: "index, follow",
};

const ROUTE_SEO = {
  "/": DEFAULT_SEO,
  "/merge": {
    title: "Merge PDF Files Online — QuickPDF",
    description:
      "Combine multiple PDF files into one document instantly with QuickPDF's private, browser-based merge tool.",
  },
  "/split": {
    title: "Split PDF Pages Online — QuickPDF",
    description:
      "Split PDF pages by range in your browser with QuickPDF. Fast, private, and easy to use.",
  },
  "/watermark": {
    title: "Add Watermark to PDF Online — QuickPDF",
    description:
      "Add custom text or image watermarks to your PDF files with QuickPDF directly in your browser.",
  },
  "/image-to-pdf": {
    title: "Convert Image to PDF Online — QuickPDF",
    description:
      "Convert images to PDF in seconds with QuickPDF's free browser-based image-to-PDF tool.",
  },
  "/compress": {
    title: "Compress PDF Online — QuickPDF",
    description:
      "Reduce PDF file size online with QuickPDF while keeping document quality suitable for sharing.",
  },
  "/rotate": {
    title: "Rotate PDF Pages Online — QuickPDF",
    description:
      "Rotate PDF pages online with precise controls using QuickPDF's simple browser-based editor.",
  },
  "/organize": {
    title: "Organize PDF Pages Online — QuickPDF",
    description:
      "Reorder and organize PDF pages quickly in your browser with QuickPDF.",
  },
  "/pdf-to-image": {
    title: "Convert PDF to Image Online — QuickPDF",
    description:
      "Export PDF pages to image files in your browser with QuickPDF's free PDF-to-image converter.",
  },
  "/grayscale": {
    title: "Convert PDF to Grayscale Online — QuickPDF",
    description:
      "Turn colorful PDF files into grayscale with QuickPDF's fast browser-based conversion tool.",
  },
  "/page-numbers": {
    title: "Add Page Numbers to PDF Online — QuickPDF",
    description:
      "Insert page numbers into your PDF files in your browser with QuickPDF's online tool.",
  },
  "/lock-pdf": {
    title: "Lock PDF with Password Online — QuickPDF",
    description:
      "Protect your PDF files with password encryption using QuickPDF in your browser.",
  },
  "/edit-pdf": {
    title: "Edit PDF Online — QuickPDF",
    description:
      "Edit PDF files online with QuickPDF using private browser-based tools.",
  },
  "/admin": {
    title: "Admin — QuickPDF",
    description: "QuickPDF admin area.",
    robots: "noindex, nofollow",
  },
};

function upsertMeta(attr, key, content) {
  let meta = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function applySeo(pathname) {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const routeMeta = ROUTE_SEO[normalizedPath] || DEFAULT_SEO;
  const mergedMeta = { ...DEFAULT_SEO, ...routeMeta };
  const pageUrl = `${SITE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;

  document.title = mergedMeta.title;
  upsertMeta("name", "description", mergedMeta.description);
  upsertMeta("name", "keywords", mergedMeta.keywords);
  upsertMeta("name", "robots", mergedMeta.robots);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:title", mergedMeta.title);
  upsertMeta("property", "og:description", mergedMeta.description);
  upsertMeta("property", "og:url", pageUrl);

  upsertMeta("name", "twitter:card", "summary");
  upsertMeta("name", "twitter:title", mergedMeta.title);
  upsertMeta("name", "twitter:description", mergedMeta.description);

  upsertCanonical(pageUrl);
}
