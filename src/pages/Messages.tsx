import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Paperclip,
  Smile,
  AlertTriangle,
  Trash2,
  Reply,
  X,
  Check,
  CheckCheck,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Proper TypeScript types
interface MessageRow {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  read: boolean;
  created_at: string;
  reply_to_id?: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message extends MessageRow {
  sender_profile?: ProfileRow | null;
  reply_to?: Message | null;
}

interface Conversation {
  user: ProfileRow;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isOnline?: boolean;
}

const BETA_WARNING_KEY = 'messages_beta_warning_seen';

// Helper function to fetch messages with profiles
const fetchMessagesWithProfiles = async (
  userId: string,
  otherUserId: string
): Promise<Message[]> => {
  const result = await (supabase
    .from('messages' as never)
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(100) as unknown as Promise<{ data: MessageRow[] | null; error: Error | null }>);

  const { data: messagesData, error } = result;

  if (error || !messagesData) {
    throw error || new Error('Failed to fetch messages');
  }

  const typedMessages = messagesData as MessageRow[];
  const senderIds = [...new Set(typedMessages.map((m) => m.sender_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', senderIds);

  const profilesMap = new Map(
    (profilesData || []).map((p) => [p.id, p] as [string, ProfileRow])
  );

  // Build reply map
  const messagesMap = new Map(typedMessages.map((m) => [m.id, m]));
  
  return typedMessages.map((msg) => {
    const replyTo = msg.reply_to_id ? messagesMap.get(msg.reply_to_id) : null;
    return {
      ...msg,
      sender_profile: profilesMap.get(msg.sender_id) || null,
      reply_to: replyTo ? {
        ...replyTo,
        sender_profile: profilesMap.get(replyTo.sender_id) || null,
      } : null,
    };
  });
};

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showBetaWarning, setShowBetaWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (selectedUserId && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, selectedUserId, scrollToBottom]);

  // Fetch conversations (last messages)
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // Get all users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .neq('id', user.id)
          .order('full_name');

        if (usersError || !usersData) {
          console.error('Error fetching users:', usersError);
          return;
        }

        const convs: Conversation[] = [];

        for (const u of usersData) {
          // Get last message
          const lastMsgResult = (await (supabase
            .from('messages' as never)
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle() as unknown)) as { data: MessageRow | null };

          const lastMsg = lastMsgResult.data as MessageRow | null;

          // Get unread count
          const countResult = (await (supabase
            .from('messages' as never)
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', u.id)
            .eq('read', false) as unknown)) as { count: number | null };

          const { count } = countResult;

          convs.push({
            user: u,
            lastMessage: lastMsg?.message || null,
            lastMessageTime: lastMsg?.created_at || null,
            unreadCount: count || 0,
            isOnline: false, // TODO: Implement online status
          });
        }

        // Sort by last message time
        convs.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        setConversations(convs);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Konuşmalar yüklenirken bir hata oluştu');
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!user || !selectedUserId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const fetchMessages = async () => {
      try {
        const messagesWithProfiles = await fetchMessagesWithProfiles(user.id, selectedUserId);
        setMessages(messagesWithProfiles);

        // Mark as read
        const unread = messagesWithProfiles.filter((m) => !m.read && m.receiver_id === user.id);
        if (unread.length > 0) {
          await (supabase
            .from('messages' as never)
            .update({ read: true } as never)
            .in('id', unread.map((m) => m.id)) as never);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Mesajlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages:${user.id}:${selectedUserId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
        } as never,
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
      const result = (await (supabase
        .from('messages' as never)
        .insert({
          sender_id: user.id,
          receiver_id: selectedUserId,
          message: newMessage.trim(),
          reply_to_id: replyingTo?.id || null,
        } as never) as unknown)) as { error: Error | null };

      const { error } = result;

      if (error) throw error;

      setNewMessage('');
      setReplyingTo(null);

      // Refresh messages
      const messagesWithProfiles = await fetchMessagesWithProfiles(user.id, selectedUserId);
      setMessages(messagesWithProfiles);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const result = (await (supabase
        .from('messages' as never)
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id) as unknown)) as { error: Error | null };

      const { error } = result;

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Mesaj silindi');
    } catch (error) {
      console.error('Mesaj silme hatası:', error);
      toast.error('Mesaj silinemedi');
    }
  };

  const handleTyping = useCallback(() => {
    if (!user || !selectedUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator (in a real app, you'd send this to the server)
    // For now, we'll just simulate it locally

    // Clear typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }, 3000);
  }, [user, selectedUserId]);

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

  const filteredConversations = useMemo(
    () =>
      conversations.filter(
        (conv) =>
          conv.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          !searchQuery
      ),
    [conversations, searchQuery]
  );

  const filteredMessages = useMemo(
    () =>
      messageSearchQuery
        ? messages.filter((msg) => msg.message.toLowerCase().includes(messageSearchQuery.toLowerCase()))
        : messages,
    [messages, messageSearchQuery]
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
                  onClick={() => {
                    setSelectedUserId(null);
                    setReplyingTo(null);
                    setMessageSearchQuery('');
                  }}
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
                  <p className="text-xs text-gray-400">
                    {selectedConversation?.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messageSearchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-300 hover:bg-[#2a3942]"
                    onClick={() => setMessageSearchQuery('')}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mesajlarda ara..."
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    className="w-48 pl-8 bg-[#2a3942] border-0 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-600 h-9"
                  />
                </div>
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
            <ScrollArea className="flex-1">
              <div
                ref={messagesContainerRef}
                className="p-4 space-y-2 bg-[#0b141a] min-h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
                }}
              >
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-16 w-64 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>{messageSearchQuery ? 'Arama sonucu bulunamadı' : 'Henüz mesaj yok'}</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, index) => {
                    const isOwn = msg.sender_id === user.id;
                    const prevMsg = filteredMessages[index - 1];
                    const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    const showTime =
                      index === filteredMessages.length - 1 ||
                      new Date(msg.created_at).getTime() -
                        new Date(filteredMessages[index + 1].created_at).getTime() >
                        300000; // 5 dakika

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwn && showAvatar && (
                          <Avatar className="h-8 w-8 mt-auto">
                            <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-[#00a884] text-white text-xs">
                              {msg.sender_profile?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!isOwn && !showAvatar && <div className="w-8" />}
                        <div
                          className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}
                        >
                          {msg.reply_to && (
                            <div
                              className={`mb-1 px-3 py-1.5 rounded text-xs border-l-2 ${
                                isOwn
                                  ? 'bg-[#005c4b]/30 border-[#00a884] text-gray-300'
                                  : 'bg-[#202c33]/50 border-gray-500 text-gray-400'
                              }`}
                            >
                              <p className="font-medium">
                                {msg.reply_to.sender_id === user.id
                                  ? 'Sen'
                                  : msg.reply_to.sender_profile?.full_name || 'Kullanıcı'}
                              </p>
                              <p className="truncate">{msg.reply_to.message}</p>
                            </div>
                          )}
                          <div className="relative">
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-[#005c4b] text-white rounded-tr-none'
                                  : 'bg-[#202c33] text-white rounded-tl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            </div>
                            {isOwn && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#202c33] border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => setReplyingTo(msg)}
                                    className="text-white focus:bg-[#2a3942]"
                                  >
                                    <Reply className="h-4 w-4 mr-2" />
                                    Yanıtla
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="text-red-400 focus:bg-red-500/20"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {!isOwn && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -left-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="bg-[#202c33] border-gray-700">
                                  <DropdownMenuItem
                                    onClick={() => setReplyingTo(msg)}
                                    className="text-white focus:bg-[#2a3942]"
                                  >
                                    <Reply className="h-4 w-4 mr-2" />
                                    Yanıtla
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {showTime && (
                            <p className="text-xs text-gray-400 mt-1 px-1 flex items-center gap-1">
                              {formatMessageTime(msg.created_at)}
                              {isOwn && (
                                <span className="ml-1">
                                  {msg.read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-400 inline" />
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-500 inline" />
                                  )}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {typingUsers.size > 0 && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8" />
                    <div className="bg-[#202c33] rounded-lg px-4 py-2 rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="bg-[#202c33] border-t border-gray-800">
              {replyingTo && (
                <div className="px-4 pt-3 pb-2 flex items-center justify-between bg-[#2a3942]/50 border-b border-gray-700">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Reply className="h-4 w-4 text-[#00a884] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-medium">
                        {replyingTo.sender_id === user.id
                          ? 'Kendi mesajına yanıt veriyorsun'
                          : `${replyingTo.sender_profile?.full_name || 'Kullanıcı'} mesajına yanıt veriyorsun`}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{replyingTo.message}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-white"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:bg-[#2a3942]"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:bg-[#2a3942]"
                  title="Dosya ekle"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder={replyingTo ? 'Yanıtınızı yazın...' : 'Mesaj yazın'}
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
                  className="bg-[#00a884] hover:bg-[#00a884]/90 text-white disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
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
