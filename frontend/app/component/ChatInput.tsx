import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  vizName: string | null;
  isLoading: boolean;
  handleUserSendMessage: () => void;
  setReplyToAssistantMessageIdx: React.Dispatch<React.SetStateAction<string | null>>;
}

interface XIconProps {
  className: string;
}

function XIcon(props: XIconProps) {
    return (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}


const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, isLoading, setReplyToAssistantMessageIdx, vizName, handleUserSendMessage }) => {

    const handleSendMessage = () => {
        handleUserSendMessage();
        setInput('');
        // setReplyToAssistantMessageIdx(null);
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="p-4 border-t">
        <div className="mb-4">
            {vizName !== null ? (
                <div className="flex flex-grow items-center space-x-2 justify-end">
                    <p className="text-sm text-gray-600">Refining viz ... {vizName}</p>
                    <Button 
                        variant="ghost"
                        onClick={() => setReplyToAssistantMessageIdx(null)}
                        className="rounded-full p-1 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <XIcon className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                    </Button>
                </div>
            ) : ""}
        </div>
        <div className="flex-grow flex items-center space-x-2">
            <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-grow"
            />

            <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || input.trim() === ''}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;
