import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Plane, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  read: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ChatWidgetProps {
  userId?: string; // Belirli bir kullanıcıyla konuşmak için
}

export default function ChatWidget({ userId }: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string | null; avatar_url: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userId || null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Fetch users (mesaj gönderebileceğiniz kullanıcılar)
  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id)
        .order('full_name');

      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, [user, isOpen]);

  // Fetch messages
  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchMessages = async () => {
      if (!selectedUserId) return;

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && messagesData) {
        // Profile bilgilerini ayrı fetch et
        interface MessageRow {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          read: boolean;
          created_at: string;
        }
        
        const senderIds = [...new Set((messagesData as MessageRow[]).map((m) => m.sender_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        interface ProfileRow {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }

        const profilesMap = new Map((profilesData || []).map((p: ProfileRow) => [p.id, p]));

        const messagesWithProfiles = (messagesData as MessageRow[]).map((msg) => ({
          ...msg,
          sender_profile: profilesMap.get(msg.sender_id) || null,
          receiver_profile: profilesMap.get(msg.receiver_id) || null,
        }));

        setMessages(messagesWithProfiles as Message[]);
        
        // Okunmamış mesajları işaretle
        const unread = (messagesData as MessageRow[]).filter((m) => !m.read && m.receiver_id === user.id);
        if (unread.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unread.map((m) => m.id));
        }
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${user.id}:${selectedUserId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        }, 
        (payload) => {
          if (payload.new) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, isOpen]);

  // Fetch unread count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();
    
    // Real-time subscription for unread count
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      
      // Mesajları yeniden yükle
      const { data: newMessagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (newMessagesData) {
        // Profile bilgilerini fetch et
        interface MessageRow {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          read: boolean;
          created_at: string;
        }
        
        interface ProfileRow {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }

        const senderIds = [...new Set((newMessagesData as MessageRow[]).map((m) => m.sender_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        const profilesMap = new Map((profilesData || []).map((p: ProfileRow) => [p.id, p]));

        const messagesWithProfiles = (newMessagesData as MessageRow[]).map((msg) => ({
          ...msg,
          sender_profile: profilesMap.get(msg.sender_id) || null,
          receiver_profile: profilesMap.get(msg.receiver_id) || null,
        }));

        setMessages(messagesWithProfiles as Message[]);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          size="icon"
          aria-label="Mesajlaşma"
        >
          <div className="relative">
            <Plane className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">✈️ Uçaktan Uçağa</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* User Selection */}
                {!selectedUserId && (
                  <div className="p-4 border-b">
                    <p className="text-sm font-medium mb-3">Kullanıcı Seç</p>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {users.map((u) => (
                          <Button
                            key={u.id}
                            variant="ghost"
                            className="w-full justify-start gap-2"
                            onClick={() => setSelectedUserId(u.id)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>{u.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{u.full_name || 'İsimsiz'}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Messages */}
                {selectedUserId && (
                  <>
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isOwn = msg.sender_id === user.id;
                          const senderName = isOwn 
                            ? 'Sen' 
                            : msg.sender_profile?.full_name || 'İsimsiz';
                          const senderAvatar = msg.sender_profile?.avatar_url;

                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={senderAvatar || undefined} />
                                <AvatarFallback>{senderName[0]}</AvatarFallback>
                              </Avatar>
                              <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`rounded-lg p-3 ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(msg.created_at), {
                                    addSuffix: true,
                                    locale: tr,
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <form onSubmit={handleSend} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Mesajınızı yazın..."
                          className="flex-1"
                          disabled={sending}
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </>
                )}

                {/* Back Button */}
                {selectedUserId && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedUserId(null)}
                    >
                      ← Kullanıcı Listesi
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      )}
    </>
  );
}

