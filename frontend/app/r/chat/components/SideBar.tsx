import React from 'react';
import { X, Menu, Plus, MessageSquare, Database, HelpCircle, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`bg-gray-100 ${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out flex flex-col`}>
      <div className="p-4 flex justify-between items-center">
        {isOpen && <h2 className="text-xl font-semibold">AgentKali</h2>}
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 p-2">
          <SidebarItem icon={<Plus size={20} />} label="New Chat" isOpen={isOpen} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Chats" isOpen={isOpen} />
          <SidebarItem icon={<Database size={20} />} label="Data" isOpen={isOpen} />
        </ul>
      </nav>
      <div className="p-4">
        <ul className="space-y-2">
          <SidebarItem icon={<HelpCircle size={20} />} label="Help" isOpen={isOpen} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" isOpen={isOpen} />
        </ul>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isOpen }) => {
  return (
    <li>
      <button className="w-full flex items-center p-2 rounded hover:bg-gray-200">
        <span className="mr-2">{icon}</span>
        {isOpen && <span>{label}</span>}
      </button>
    </li>
  );
};

export default Sidebar;

