import React from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Navbar } from "./components/layout/Navbar";
import { PageContainer } from "./components/layout/PageContainer";
import { AnimatedBackground } from "./components/ui/AnimatedBackground";

// pages
import { Home } from "./pages/Home/Home";
import { Merge } from "./pages/Merge/Merge";
import { Split } from "./pages/Split/Split";
import { Watermark } from "./pages/Watermark/Watermark";
import { ImageToPdf } from "./pages/ImageToPdf/ImageToPdf";
import { Compress } from "./pages/Compress/Compress";
import { Rotate } from "./pages/Rotate/Rotate";
import { Organize } from "./pages/Organize/Organize";
import { PdfToImage } from "./pages/PDFtoImage/PDFtoImage";
import { Grayscale }   from "./pages/Grayscale/Grayscale";
import { PageNumbers } from "./pages/PageNumbers/PageNumbers";

function App() {
  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white overflow-x-hidden w-full">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col flex-grow w-full">
        <Navbar />
        <PageContainer>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<Merge />} />
            <Route path="/split" element={<Split />} />
            <Route path="/watermark" element={<Watermark />} />
            <Route path="/image-to-pdf" element={<ImageToPdf />} />
            <Route path="/compress" element={<Compress />} />
            <Route path="/rotate" element={<Rotate />} />
            <Route path="/organize" element={<Organize />} />
            <Route path="/pdf-to-image" element={<PdfToImage />} />
            <Route path="/grayscale"    element={<Grayscale />} />
            <Route path="/page-numbers" element={<PageNumbers />} />
          </Routes>
        </PageContainer>
      </div>
      <Analytics />
    </div>
  );
}

export default App;
