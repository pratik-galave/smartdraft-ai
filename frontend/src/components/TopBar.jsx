import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInbox = location.pathname === '/';

  if (isInbox) {
    return (
      <header className="flex justify-between items-center px-margin-desktop h-16 fixed top-0 right-0 z-30 ml-[280px] w-[calc(100%-280px)] bg-surface dark:bg-surface-dim shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-headline-md text-headline-md font-extrabold text-on-surface dark:text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span>
            AI Hub
          </div>
          <div className="hidden md:flex items-center gap-2 border-l border-outline-variant pl-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Active</span>
          </div>
        </div>

        {/* Center Search */}
        <div className="flex-1 max-w-md mx-8 hidden lg:block">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pl-10 pr-4 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              placeholder="Search emails, subjects, or AI summaries..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="flex items-center gap-3 border-l border-outline-variant pl-4 ml-2">
            <div className="text-right hidden sm:block">
              <p className="font-label-sm text-label-sm text-on-surface font-semibold">Admin User</p>
            </div>
            <img 
              alt="User Avatar" 
              className="w-8 h-8 rounded-full border border-outline-variant object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIElOhyZIZUrZDhIRmdThaU9v-gorrTCnJksRW_bR60wCNG98C0gpuXGDWTpPSK72M1sFNDbPpoaViLv8A1ixLhS0VaoM_O0U8GHmL2L9wXtAmmv9xRCsv5Waa3P6IrifqCUApevrB-N-0RJp93tprtHw0nzybLreeEz1zjKPjXsqXVq28tO2sgMPh7f5JHVPiBSYnsUpq0uzhXjatlNEu5XNltKglRSEFU91N7OBwWQtJy9R5XWwkVyVXvW0rz8ODRgF7fcNsyhIn"
            />
          </div>
        </div>
      </header>
    );
  }

  // Detail Page Header
  return (
    <header className="h-16 px-margin-desktop flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-30 shadow-sm w-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="relative w-64 hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input 
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" 
            placeholder="Search emails..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white"></span>
        </button>
        <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-label-sm font-bold overflow-hidden border-2 border-white shadow-sm ml-2">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfFEoIuPDP1-LvkyRTasvHZ6-2QZJIc-sWWzwey5S7Pn3pjvO9ORQhOVmSUin4IJahDDBF-616sM6Bm5U8HOF0LQkFzakmUq_6POPtW8--PzXfjbFYRYrmHjVhPY3CBqdiF9_bPnNQnqY9J6wT1Qlpil-hLNNnbqUOAsVxukS62xFvT5F2c-I373ohVthcBKBIOyWZHMbT5o5R_Fnr6aj-KNs0Acoka8nwPJ9hd9Iy_kQqHax3qfy9Igh6gnuBN5INaezf5nBwtOMW"
          />
        </div>
      </div>
    </header>
  );
}
