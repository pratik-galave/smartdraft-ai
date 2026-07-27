import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Inbox from './pages/Inbox';
import EmailDetail from './pages/EmailDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background font-body-md min-h-screen flex antialiased selection:bg-primary-container selection:text-white">
        {/* Ambient Background (from Detail Page) */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none hidden md:block">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary-container/5 blur-[100px]"></div>
          <div className="absolute inset-0 bg-noise"></div>
        </div>

        <Sidebar />
        <main className="ml-0 md:ml-[280px] w-full md:w-[calc(100%-280px)] min-h-screen flex flex-col relative bg-background">
          <TopBar />
          <Routes>
            <Route path="/" element={<Inbox />} />
            <Route path="/email/:id" element={<EmailDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
