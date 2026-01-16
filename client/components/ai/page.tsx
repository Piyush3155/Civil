'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AiChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.text }),
      });

      const data = await response.json();

      let aiResponseText = '';

      if (data.error) {
        aiResponseText = `❌ Error: ${data.error}`;
        if (data.sqlError) {
          aiResponseText += `\n\nSQL Error: ${data.sqlError}`;
        }
      } else if (data.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
          aiResponseText = '📭 No results found for your query.';
        } else {
          aiResponseText = `✅ Found ${data.results.length} result(s):\n\n\`\`\`json\n${JSON.stringify(data.results, null, 2)}\n\`\`\``;
        }
      } else {
        aiResponseText = '✅ Query executed successfully, but no results to display.';
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 px-4 pt-4">
        <h1 className="text-xl font-bold">AI Assistant</h1>
        <p className="text-sm text-gray-600">Ask me anything about your civil construction projects!</p>
      </div>

      <Card className="flex-1 flex flex-col mx-4 mb-4">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm mb-4">🤖 Hi! I&apos;m your AI assistant for construction project data.</p>
                <p className="text-sm mb-4">Try asking questions like:</p>
                <div className="space-y-2 text-xs text-left max-w-md mx-auto">
                  <div className="bg-blue-50 p-2 rounded">
                    • &quot;Show me all active projects&quot;
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    • &quot;How many tasks are completed this month?&quot;
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    • &quot;List all materials with low stock&quot;
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    • &quot;Show equipment currently in use&quot;
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    • &quot;What are the pending QC issues?&quot;
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {message.text}
                  </pre>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your projects, tasks, materials..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export { AiChatbot };;