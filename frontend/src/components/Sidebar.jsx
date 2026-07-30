import React from 'react';
import { NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] z-40 bg-inverse-surface dark:bg-surface-container-lowest text-primary-fixed dark:text-primary-fixed-dim flex flex-col flat no shadows hidden md:flex">
      <div className="p-6 flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-white">AI Email Assistant</h1>
            <p className="font-label-sm text-label-sm text-secondary-fixed-dim">Enterprise Tier</p>
          </div>
        </div>
        {/* CTA */}
        <button onClick={() => toast('This feature is coming soon!', { icon: '🚧' })} className="w-full bg-primary-container text-on-primary font-label-md text-label-md py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container/90 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          Compose New
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 px-4 flex flex-col gap-2 custom-scrollbar overflow-y-auto">
        <NavLink to="/" className={({ isActive }) => `rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md transition-all ${isActive ? 'bg-on-secondary-fixed-variant text-white opacity-90 scale-95' : 'text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
          Inbox
          <span className="ml-auto bg-primary-container text-on-primary text-[10px] px-2 py-0.5 rounded-full">12</span>
        </NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">edit_note</span>
          Drafts
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">verified</span>
          Approved
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">send</span>
          Sent
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">archive</span>
          Archive
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">delete</span>
          Trash
        </a>
      </nav>

      {/* Footer Tabs */}
      <div className="p-4 flex flex-col gap-2 border-t border-inverse-surface mt-auto">
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">help</span>
          Help
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); toast('This feature is coming soon!', { icon: '🚧' }); }} className="text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:bg-on-secondary-fixed-variant transition-colors duration-200 rounded-lg px-4 py-3 flex items-center gap-3 font-label-md text-label-md">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </a>
      </div>
    </aside>
  );
}
