import React from 'react';

export function PageContainer({ children }) {
  return (
    // min-h-[calc(100vh-4rem)] ensures the container takes up the rest of the screen minus the 4rem (64px) Navbar height
    <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {children}
    </main>
  );
}
