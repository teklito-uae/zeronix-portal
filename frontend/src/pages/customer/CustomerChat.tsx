import { useState, useEffect, useRef } from 'react';
import { mockChatMessages } from '@/lib/mockData';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Check, CheckCheck, MessageCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CustomerChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages.filter(m => m.chat_room_id === 2));
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: messages.length + 1,
      chat_room_id: 2,
      sender_type: 'customer',
      message: newMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate auto-reply from admin
    setTimeout(() => {
      const reply: ChatMessage = {
        id: messages.length + 2,
        chat_room_id: 2,
        sender_type: 'user',
        sender_id: 1,
        message: "Thank you for your message! An agent will be with you shortly to assist with your enquiry.",
        is_read: true,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-bg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zeronix-blue rounded-full flex items-center justify-center text-white">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-admin-text-primary text-sm">Zeronix Support</h3>
            <p className="text-xs text-success flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              Agents are online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-admin-text-muted hover:text-admin-text-primary">
          <Info size={18} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 bg-slate-50 dark:bg-admin-bg/50">
        <div className="space-y-4">
          <div className="flex justify-center">
            <span className="text-[10px] uppercase tracking-widest text-admin-text-muted bg-admin-bg px-2 py-1 rounded-full border border-admin-border font-medium">
              Today
            </span>
          </div>
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.sender_type === 'customer' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm shadow-sm",
                  msg.sender_type === 'customer'
                    ? "bg-zeronix-blue text-white rounded-tr-none"
                    : "bg-admin-surface text-admin-text-primary border border-admin-border rounded-tl-none"
                )}
              >
                {msg.message}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-admin-text-muted">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender_type === 'customer' && (
                  msg.is_read ? <CheckCheck size={12} className="text-zeronix-blue" /> : <Check size={12} className="text-admin-text-muted" />
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-admin-bg border-t border-admin-border">
        <div className="flex gap-2">
          <Input
            placeholder="Describe your requirement or ask a question..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-admin-surface border-admin-border h-11"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-11 px-6 shadow-lg shadow-zeronix-blue/20"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-[10px] text-center text-admin-text-muted mt-3 italic">
          Messages are encrypted and sent securely to our sales team.
        </p>
      </div>
    </div>
  );
};
