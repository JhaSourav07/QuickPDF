import React from "react";
import { Routes, Route } from "react-router-dom";
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
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
}

export default App;
