import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { PageContainer } from './components/layout/PageContainer';
import { AnimatedBackground } from './components/ui/AnimatedBackground'; // <-- Import the background

// pages
import { Home } from './pages/Home/Home'; 
import { Merge } from './pages/Merge/Merge';
import { Split } from './pages/Split/Split';

function App() {
  return (
    // 1. Added relative, bg-black, text-white, and overflow-x-hidden to the root
    <div className="relative flex flex-col min-h-screen bg-black text-white overflow-x-hidden w-full">
      
      {/* 2. Place the background here so it spans the entire app */}
      <AnimatedBackground />
      
      {/* 3. Wrap your existing layout in a relative z-10 div. 
          This is crucial! It forces your Navbar and Pages to sit *above* the background. */}
      <div className="relative z-10 flex flex-col flex-grow w-full">
        <Navbar />
        
        <PageContainer>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<Merge />} />
            <Route path="/split" element={<Split />} />
          </Routes>
        </PageContainer>
      </div>
      
    </div>
  );
}

export default App;