/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, MoreVertical, Phone, Video, ArrowLeft, Paperclip, Smile, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
}

interface Conversation {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
}

const BETA_WARNING_KEY = 'messages_beta_warning_seen';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBetaWarning, setShowBetaWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Beta warning popup
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem(BETA_WARNING_KEY);
    if (!hasSeenWarning) {
      setTimeout(() => {
        setShowBetaWarning(true);
      }, 500);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, selectedUserId]);

  // Fetch conversations (last messages)
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Get all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id)
        .order('full_name');

      if (!usersData) return;

      const convs: Conversation[] = [];

      for (const u of usersData) {
        // Get last message
        const { data: lastMsg } = await (supabase
          .from('messages' as any)
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as any);

        // Get unread count
        const { count } = await (supabase
          .from('messages' as any)
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', u.id)
          .eq('read', false) as any);

        convs.push({
          user: u,
          lastMessage: (lastMsg as any)?.message || null,
          lastMessageTime: (lastMsg as any)?.created_at || null,
          unreadCount: count || 0,
        });
      }

      // Sort by last message time
      convs.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(convs);
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Her 5 saniyede bir güncelle

    return () => clearInterval(interval);
  }, [user]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!user || !selectedUserId) return;

    const fetchMessages = async () => {
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

      const { data: messagesData, error } = await (supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100) as any);

      if (!error && messagesData) {
        const typedMessages = messagesData as MessageRow[];
        const senderIds = [...new Set(typedMessages.map((m) => m.sender_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        const profilesMap = new Map(((profilesData || []) as ProfileRow[]).map((p) => [p.id, p] as [string, ProfileRow]));

        const messagesWithProfiles = typedMessages.map((msg) => ({
          ...msg,
          sender_profile: profilesMap.get(msg.sender_id) || null,
        }));

        setMessages(messagesWithProfiles as Message[]);

        // Mark as read
        const unread = typedMessages.filter((m) => !m.read && m.receiver_id === user.id);
        if (unread.length > 0) {
          await (supabase
            .from('messages' as any)
            .update({ read: true })
            .in('id', unread.map((m) => m.id)) as any);
        }
      }
    };

    fetchMessages();

      // Real-time subscription
    const channel = supabase
      .channel(`messages:${user.id}:${selectedUserId}`)
      .on('postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    setSending(true);
    try {
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

      const { error } = await (supabase
        .from('messages' as any)
        .insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          message: newMessage.trim(),
        }) as any);

      if (error) throw error;

      setNewMessage('');

      // Refresh messages
      const { data: newMessagesData } = await (supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100) as any);

      if (newMessagesData) {
        const typedMessages = newMessagesData as MessageRow[];
        const senderIds = [...new Set(typedMessages.map((m) => m.sender_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        const profilesMap = new Map(((profilesData || []) as ProfileRow[]).map((p) => [p.id, p] as [string, ProfileRow]));

        const messagesWithProfiles = typedMessages.map((msg) => ({
          ...msg,
          sender_profile: profilesMap.get(msg.sender_id) || null,
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

  const formatMessageTime = (date: string) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) {
      return format(msgDate, 'HH:mm', { locale: tr });
    } else if (isYesterday(msgDate)) {
      return 'Dün';
    } else {
      return format(msgDate, 'dd/MM/yyyy', { locale: tr });
    }
  };

  const formatConversationTime = (date: string | null) => {
    if (!date) return '';
    const msgDate = new Date(date);
    if (isToday(msgDate)) {
      return format(msgDate, 'HH:mm', { locale: tr });
    } else if (isYesterday(msgDate)) {
      return 'Dün';
    } else {
      return format(msgDate, 'dd/MM/yyyy', { locale: tr });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    !searchQuery
  );

  const handleCloseBetaWarning = () => {
    setShowBetaWarning(false);
    localStorage.setItem(BETA_WARNING_KEY, 'true');
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const selectedConversation = conversations.find(c => c.user.id === selectedUserId);

  return (
    <div className="h-screen flex flex-col bg-[#0b141a]">
      <Navbar />

      {/* Beta Warning Popup */}
      <Dialog open={showBetaWarning} onOpenChange={handleCloseBetaWarning}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-muted/20 border-2 border-yellow-500/50">
          <DialogHeader className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <AlertTriangle className="h-6 w-6 text-yellow-500 animate-pulse" />
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <span>✈️ Uçaktan Uçağa Mesajlaşma</span>
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  BETA
                </Badge>
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-muted-foreground space-y-3">
              <p className="font-semibold text-foreground">
                Bu özellik şu anda BETA aşamasındadır!
              </p>
              <div className="text-left space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Mesajlaşma sırasında geçici sorunlar yaşanabilir</span>
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Bazı mesajlar gecikmeli gönderilebilir</span>
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Gerçek zamanlı güncellemeler test aşamasında</span>
                </p>
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Herhangi bir sorun yaşarsanız lütfen bize bildirin</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Bu uyarıyı bir daha gösterme
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
            <Button
              onClick={handleCloseBetaWarning}
              className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
              size="sm"
            >
              Anladım, Devam Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className={`w-full md:w-96 bg-[#111b21] border-r border-gray-800 flex flex-col transition-all ${
          selectedUserId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-gray-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ara veya yeni sohbet başlat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#2a3942] border-0 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-600"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Konuşma bulunamadı</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.user.id === selectedUserId;
                return (
                  <button
                    key={conv.user.id}
                    onClick={() => setSelectedUserId(conv.user.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#202c33] transition-colors ${
                      isSelected ? 'bg-[#2a3942]' : ''
                    } border-b border-gray-800/50`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-[#00a884] text-white">
                        {conv.user.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white truncate">
                          {conv.user.full_name || 'İsimsiz'}
                        </p>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-gray-400 ml-2">
                            {formatConversationTime(conv.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400 truncate">
                          {conv.lastMessage || 'Yeni konuşma başlat'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-[#00a884] text-white h-5 min-w-[20px] flex items-center justify-center text-xs">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        {selectedUserId ? (
          <div className="flex-1 flex flex-col bg-[#0b141a]">
            {/* Chat Header */}
            <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden p-2 hover:bg-[#2a3942] rounded-full"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-300" />
                </button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation?.user.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#00a884] text-white">
                    {selectedConversation?.user.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">
                    {selectedConversation?.user.full_name || 'İsimsiz'}
                  </p>
                  <p className="text-xs text-gray-400">Çevrimiçi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-[#2a3942]">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-[#2a3942]">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-[#2a3942]">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0b141a]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
              }}
            >
              {messages.map((msg, index) => {
                const isOwn = msg.sender_id === user.id;
                const prevMsg = messages[index - 1];
                const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const showTime = index === messages.length - 1 || 
                  new Date(msg.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000; // 5 dakika

                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && showAvatar && (
                      <Avatar className="h-8 w-8 mt-auto">
                        <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#00a884] text-white text-xs">
                          {msg.sender_profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8" />}
                    <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-[#005c4b] text-white rounded-tr-none'
                            : 'bg-[#202c33] text-white rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      {showTime && (
                        <p className="text-xs text-gray-400 mt-1 px-1">
                          {formatMessageTime(msg.created_at)}
                          {isOwn && msg.read && <span className="ml-1">✓✓</span>}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#202c33] px-4 py-3 border-t border-gray-800">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:bg-[#2a3942]"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:bg-[#2a3942]"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın"
                  className="flex-1 bg-[#2a3942] border-0 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#00a884]"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  size="icon"
                  className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-[#0b141a]">
            <div className="text-center">
              <div className="w-96 h-96 mx-auto mb-4 opacity-10">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <path
                    d="M100 20 L120 80 L180 100 L120 120 L100 180 L80 120 L20 100 L80 80 Z"
                    fill="currentColor"
                    className="text-white"
                  />
                </svg>
              </div>
              <p className="text-2xl font-light text-gray-400 mb-2 flex items-center justify-center gap-2">
                <span>✈️ Uçaktan Uçağa Mesajlaşma</span>
                <Badge variant="secondary" className="bg-yellow-500 text-white text-xs">
                  BETA
                </Badge>
              </p>
              <p className="text-gray-500">
                Sol taraftan bir konuşma seçerek mesajlaşmaya başlayın
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
