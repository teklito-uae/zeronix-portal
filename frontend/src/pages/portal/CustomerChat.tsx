import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getEchoInstance } from '@/lib/echo';
import type { ChatRoom, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Check, CheckCheck, MessageCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CustomerChat = () => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Room & Messages
  const { data: roomData, isLoading } = useQuery({
    queryKey: ['customer-chat-room'],
    queryFn: async () => {
      const res = await api.get('/customer/chat/room');
      return res.data as { conversation: ChatRoom, messages: ChatMessage[] };
    }
  });

  const conversation = roomData?.conversation;
  const messages = roomData?.messages || [];

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/customer/chat/room/read');
    }
  });

  // Call mark as read when messages load
  useEffect(() => {
    if (messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await api.post('/customer/chat/room/messages', { message: messageText });
      return res.data as ChatMessage;
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['customer-chat-room'], (old: any) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, newMsg] };
      });
      setNewMessage('');
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  // Pusher Echo Integration
  useEffect(() => {
    if (!conversation?.id) return;

    const echo = getEchoInstance('customer');
    const channelName = `chat.${conversation.id}`;
    const channel = echo.private(channelName);
    
    channel.listen('MessageSent', (e: { message: ChatMessage }) => {
      const incomingMsg = e.message;
      
      // If admin sent it, append and mark read
      if (incomingMsg.sender_type === 'user') {
        queryClient.setQueryData(['customer-chat-room'], (old: any) => {
          if (!old) return old;
          if (old.messages.some((m: ChatMessage) => m.id === incomingMsg.id)) return old;
          return { ...old, messages: [...old.messages, incomingMsg] };
        });
        
        markAsReadMutation.mutate();
      }
    });

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [conversation?.id]);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-bg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zeronix-blue rounded-full flex items-center justify-center text-white shadow-sm">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-admin-text-primary text-sm">Zeronix Support</h3>
            <div className="text-xs text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Agents are online
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-admin-text-muted hover:text-admin-text-primary">
          <Info size={18} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 bg-slate-50 dark:bg-admin-bg/50">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zeronix-blue" /></div>
        ) : (
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
        )}
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
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-11 px-6 shadow-lg shadow-zeronix-blue/20"
          >
            {sendMessageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        <p className="text-[10px] text-center text-admin-text-muted mt-3 italic">
          Messages are encrypted and sent securely to our sales team.
        </p>
      </div>
    </div>
  );
};
