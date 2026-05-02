import { getBasePath } from '@/hooks/useBasePath';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { getEchoInstance } from '@/lib/echo';
import type { ChatRoom, ChatMessage } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Check, CheckCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Chat = () => {
  const queryClient = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Rooms
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['admin-chat-rooms'],
    queryFn: async () => {
      const res = await api.get(`${getBasePath()}/chat/rooms`);
      return res.data as ChatRoom[];
    },
    refetchInterval: 10000, // Poll every 10s for new rooms/badges
  });

  // Fetch Active Room Messages
  const { data: roomData, isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-chat-messages', activeRoomId],
    queryFn: async () => {
      const res = await api.get(`${getBasePath()}/chat/rooms/${activeRoomId}/messages`);
      return res.data as { conversation: ChatRoom, messages: ChatMessage[] };
    },
    enabled: !!activeRoomId,
  });

  const messages = roomData?.messages || [];
  const activeRoom = roomData?.conversation || rooms.find(r => r.id === activeRoomId);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: number) => {
      await api.post(`${getBasePath()}/chat/rooms/${roomId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
    }
  });

  // Handle Room Selection
  const handleSelectRoom = (roomId: number) => {
    setActiveRoomId(roomId);
    setMobileView('chat');
    markAsReadMutation.mutate(roomId);
  };

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await api.post(`${getBasePath()}/chat/rooms/${activeRoomId}/messages`, { message: messageText });
      return res.data as ChatMessage;
    },
    onSuccess: (newMsg) => {
      // Optimistically append message
      queryClient.setQueryData(['admin-chat-messages', activeRoomId], (old: any) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, newMsg] };
      });
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
      setNewMessage('');
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeRoomId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  // Pusher Echo Integration
  useEffect(() => {
    if (!activeRoomId) return;

    const echo = getEchoInstance('admin');
    const channelName = `chat.${activeRoomId}`;
    const channel = echo.private(channelName);
    
    channel.listen('MessageSent', (e: { message: ChatMessage }) => {
      const incomingMsg = e.message;
      
      // If customer sent it, append and mark read
      if (incomingMsg.sender_type === 'customer') {
        queryClient.setQueryData(['admin-chat-messages', activeRoomId], (old: any) => {
          if (!old) return old;
          if (old.messages.some((m: ChatMessage) => m.id === incomingMsg.id)) return old;
          return { ...old, messages: [...old.messages, incomingMsg] };
        });
        
        markAsReadMutation.mutate(activeRoomId);
        queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
      }
    });

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [activeRoomId]);

  const filteredRooms = rooms.filter(r => 
    r.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
      {/* LEFT SIDEBAR: Room List */}
      <div className={cn(
        "border-r border-admin-border flex flex-col bg-admin-bg",
        "w-full md:w-80",
        mobileView === 'chat' ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 sm:p-4 border-b border-admin-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={16} />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-admin-surface border-admin-border"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {loadingRooms ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zeronix-blue" /></div>
          ) : (
            <div className="divide-y divide-admin-border">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className={cn(
                    "w-full p-3 sm:p-4 flex gap-3 items-start transition-colors hover:bg-admin-surface-hover text-left",
                    activeRoomId === room.id && "bg-zeronix-blue/5 border-l-2 border-l-zeronix-blue"
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-zeronix-blue text-white font-medium">
                      {room.customer?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-admin-text-primary text-sm truncate">
                        {room.customer?.company || room.customer?.name}
                      </h4>
                      {room.last_message_at && (
                        <span className="text-[10px] text-admin-text-muted font-medium ml-2 shrink-0">
                          {new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-admin-text-secondary truncate pr-4">
                      {room.last_message || 'No messages yet'}
                    </p>
                  </div>
                  {room.unread_count && room.unread_count > 0 && room.id !== activeRoomId ? (
                    <span className="bg-zeronix-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                      {room.unread_count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT SIDE: Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-admin-surface",
        mobileView === 'list' ? "hidden md:flex" : "flex"
      )}>
        {activeRoom ? (
          <>
            <div className="p-3 sm:p-4 border-b border-admin-border flex items-center justify-between bg-admin-bg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-admin-text-muted hover:bg-admin-surface-hover"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-zeronix-blue text-white font-medium">
                    {activeRoom?.customer?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-admin-text-primary text-sm">
                    {activeRoom?.customer?.name}
                  </h3>
                  <p className="text-xs text-admin-text-secondary">
                    {activeRoom?.customer?.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wider hidden sm:inline">Online</span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 sm:p-6">
              {loadingMessages ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zeronix-blue" /></div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[85%] sm:max-w-[70%]",
                        msg.sender_type === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-sm shadow-sm",
                          msg.sender_type === 'user'
                            ? "bg-zeronix-blue text-white rounded-tr-none"
                            : "bg-admin-bg text-admin-text-primary border border-admin-border rounded-tl-none"
                        )}
                      >
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-admin-text-muted">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender_type === 'user' && (
                          msg.is_read ? <CheckCheck size={12} className="text-zeronix-blue" /> : <Check size={12} className="text-admin-text-muted" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-3 sm:p-4 bg-admin-bg border-t border-admin-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-admin-surface border-admin-border h-11"
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-11 px-4 sm:px-5"
                >
                  {sendMessageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-admin-bg">
            <div className="h-16 w-16 bg-admin-surface rounded-full flex items-center justify-center border border-admin-border mb-4">
              <Send size={24} className="text-admin-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-admin-text-primary mb-2">Select a Conversation</h3>
            <p className="text-sm text-admin-text-secondary max-w-xs">
              Choose a customer from the left to start chatting and answering their enquiries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
