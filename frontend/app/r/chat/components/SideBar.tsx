import React from 'react'
import { MessageSquare, MessageCircle, Database, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SideBarProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ expanded, setExpanded }) => {
  return (
    <aside className={cn("h-screen fixed top-0 left-0 z-40 transition-all duration-300", expanded ? "w-64" : "w-16")}>
      <nav className="h-full flex flex-col bg-gray-50 border-r shadow-sm">
        <div className="p-4 pb-2 flex justify-between items-center">
          <h2
            className={cn(
              "overflow-hidden transition-all font-bold text-xl text-gray-600",
              expanded ? "w-32" : "w-0"
            )}
          >
            AgentKali
          </h2>
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600"
          >
            {expanded ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        <ul className="flex-1 px-3">
          {[
            { icon: MessageSquare, label: "New Chat" },
            { icon: MessageCircle, label: "Chats" },
            { icon: Database, label: "Data" },
          ].map((item, index) => (
            <li key={index}>
              <Button
                variant="ghost"
                className={cn(
                  "relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group w-full",
                  expanded ? "justify-start" : "justify-center",
                  "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                <item.icon className={cn("w-5 h-5", expanded && "mr-2")} />
                <span
                  className={cn(
                    "overflow-hidden transition-all",
                    expanded ? "w-52" : "w-0"
                  )}
                >
                  {item.label}
                </span>
                {!expanded && (
                  <div
                    className={cn(
                      "absolute rounded-md px-2 py-1",
                      "bg-indigo-100 text-indigo-800 text-sm",
                      "invisible opacity-20 -translate-x-3 transition-all",
                      "group-hover:visible group-hover:opacity-100 group-hover:translate-x-0"
                    )}
                  >
                    {item.label}
                  </div>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default SideBar
