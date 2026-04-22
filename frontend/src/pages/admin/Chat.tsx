import { useState, useEffect, useRef } from 'react';
import { mockChatRooms, mockChatMessages } from '@/lib/mockData';
import type { ChatRoom, ChatMessage } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>(mockChatRooms);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(mockChatRooms[0]?.id || null);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const currentMessages = messages.filter(m => m.chat_room_id === activeRoomId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeRoomId) return;

    const newMsg: ChatMessage = {
      id: messages.length + 1,
      chat_room_id: activeRoomId,
      sender_type: 'user',
      sender_id: 1, // Admin user ID
      message: newMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Update last message in room
    setRooms(rooms.map(r => 
      r.id === activeRoomId 
        ? { ...r, last_message: newMessage, last_message_at: new Date().toISOString() } 
        : r
    ));
  };

  const filteredRooms = rooms.filter(r => 
    r.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-admin-surface border border-admin-border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar: Chat Rooms */}
      <div className="w-80 border-r border-admin-border flex flex-col bg-admin-bg">
        <div className="p-4 border-b border-admin-border">
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
          <div className="divide-y divide-admin-border">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={cn(
                  "w-full p-4 flex gap-3 items-start transition-colors hover:bg-admin-surface-hover text-left",
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
                      <span className="text-[10px] text-admin-text-muted font-medium">
                        {new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-admin-text-secondary truncate pr-4">
                    {room.last_message}
                  </p>
                </div>
                {room.unread_count && room.unread_count > 0 && room.id !== activeRoomId && (
                  <span className="bg-zeronix-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                    {room.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-admin-surface">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-admin-border flex items-center justify-between bg-admin-bg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-zeronix-blue text-white font-medium">
                    {activeRoom.customer?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-admin-text-primary text-sm">
                    {activeRoom.customer?.name}
                  </h3>
                  <p className="text-xs text-admin-text-secondary">
                    {activeRoom.customer?.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-[url('/chat-bg.png')] bg-repeat opacity-95">
              <div className="space-y-4">
                {currentMessages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%]",
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
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-admin-bg border-t border-admin-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-admin-surface border-admin-border h-11"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-11 px-5"
                >
                  <Send size={18} />
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
