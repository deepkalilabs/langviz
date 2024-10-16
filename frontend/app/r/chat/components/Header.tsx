import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="text-sm text-gray-500">
          You have <span className="text-red-500">10 free message</span> left. 
          <a href="#" className="text-blue-500 hover:underline ml-1">Upgrade now</a>
        </div>
      </div>
    </header>
  );
};

export default Header;

