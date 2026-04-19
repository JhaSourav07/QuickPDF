import React from 'react';

export function PageContainer({ children }) {
  return (
    // min-h-[calc(100vh-4rem)] ensures the container takes up the rest of the screen minus the 4rem (64px) Navbar height
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] mt-16">
      {children}
    </main>
  );
}
