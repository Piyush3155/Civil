'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Standard shadcn utility
import { Project } from '@/types/analytics';

// --- Types ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  projects?: Project[];
  queryType?: string;
  needsProjectSelection?: boolean;
}


const SUGGESTIONS = [
  "Active projects?",
  "Which project?",
  "Task status?",
  "Low stock materials?",
  "Equipment in use?",
  "Purchase orders?",
];

// --- Sub-component: Chat Bubble ---
const ChatBubble = ({ message, onProjectSelect }: { message: Message; onProjectSelect?: (projectId: string, queryType: string) => void }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm",
          isUser ? "bg-blue-600 text-white rounded-tr-none" : "bg-secondary text-secondary-foreground rounded-tl-none"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          
          {/* Project Selection Options */}
          {message.needsProjectSelection && message.projects && onProjectSelect && (
            <div className="mt-3 space-y-2">
              {message.projects.map((project) => (
                <Button
                  key={project.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => onProjectSelect(project.id, message.queryType || '')}
                >
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs opacity-70">{project.code} • {project.location}</div>
                    <div className="text-xs text-primary mt-1">Click to view {message.queryType}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
          
          <time className="text-[10px] opacity-70 mt-1 block">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export const AiChatbot: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProjectSelect = async (projectId: string, queryType: string) => {
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: `Get ${queryType} data for selected project`,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/project-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, queryType }),
      });

      const data = await response.json();
      
      const aiText = data.error 
        ? `❌ Error: ${data.error}` 
        : data.results || 'Data retrieved successfully.';

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } catch  {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text: "I'm having trouble fetching the project data.",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = text || inputValue;
    if (!content.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: content }),
      });

      const data = await response.json();
      
      // Logic for parsing response (kept similar to your logic but cleaned up)
      const aiText = data.error 
        ? `❌ Error: ${data.error}` 
        : data.results 
          ? (typeof data.results === 'string' ? data.results : `Results found: ${data.results.length}`)
          : 'Query executed successfully.';

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text: "I'm having trouble connecting to the server.",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-md border rounded-xl bg-background shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="font-semibold text-sm">Operations Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10">
              <Bot size={40} className="text-muted-foreground opacity-50" />
              <div className="space-y-1">
                <p className="font-medium">How can I help today?</p>
                <p className="text-xs text-muted-foreground">Ask about projects, stock, or tasks.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-[80%]">
                {SUGGESTIONS.map(s => (
                  <Button key={s} variant="outline" size="sm" className="text-xs" onClick={() => handleSend(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => <ChatBubble key={m.id} message={m} onProjectSelect={handleProjectSelect} />)}
          
          {isLoading && (
            <div className="flex gap-2 items-center text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-secondary rounded-2xl px-4 py-2 rounded-tl-none">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};