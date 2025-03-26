"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { MessageCircle, Send, Trash2, MoreVertical } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: number
  volunteer_name: string
  volunteer_email: string
  message: string
  created_at: string
  volunteer_id: string | null
}

interface EventChatProps {
  eventId: number
}

export function EventChat({ eventId }: EventChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // For organizer identity
  const organizerInfo = {
    id: "80816b3d-ca57-4960-b2b4-0109eeedb513", // Hardcoded UUID as requested
    name: "[Organizer]",
    email: "organizer@example.com"
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: true })
        
        if (error) {
          throw error
        }
        
        setMessages(data || [])
      } catch (error: any) {
        console.error("Error fetching chat messages:", error)
        toast.error("Failed to load chat messages")
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
    
    // Subscribe to new messages (realtime)
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        // @ts-ignore
        setMessages(current => [...current, payload.new])
        setTimeout(scrollToBottom, 100)
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        // @ts-ignore
        setMessages(current => current.filter(msg => msg.id !== payload.old.id))
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom()
    }
  }, [loading, messages.length])

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    
    setSubmitting(true)
    
    try {
      // Directly insert into chat_messages table
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          event_id: eventId,
          volunteer_id: organizerInfo.id,
          volunteer_non_auth_id: null,
          volunteer_name: organizerInfo.name,
          volunteer_email: organizerInfo.email,
          message: newMessage
        })
        .select()
      
      if (error) {
        throw error
      }
      
      // Immediately add the message to the UI without waiting for realtime update
      if (data && data.length > 0) {
        setMessages(current => [...current, data[0]])
        setTimeout(scrollToBottom, 100)
      }
      
      setNewMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete a message
  const deleteMessage = async () => {
    if (!messageToDelete) return
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageToDelete.id)
      
      if (error) {
        throw error
      }
      
      toast.success("Message deleted")
      
      // Filter out the deleted message from the state (realtime will also handle this)
      setMessages(current => current.filter(msg => msg.id !== messageToDelete.id))
    } catch (error: any) {
      console.error("Error deleting message:", error)
      toast.error("Failed to delete message")
    } finally {
      setMessageToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), "MMM d, h:mm a")
  }

  // Determine if a message is from the current user (organizer)
  const isCurrentUserMessage = (msg: Message) => {
    return msg.volunteer_id === organizerInfo.id
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <MessageCircle className="text-gray-400 h-12 w-12 mb-2" />
            <p className="text-gray-500">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = isCurrentUserMessage(msg)
              
              return (
                <div 
                  key={msg.id} 
                  className={`chat-message ${isCurrentUser ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}
                >
                  <div className={`flex items-start ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <div 
                      className={`rounded-full h-8 w-8 flex items-center justify-center mr-2 text-sm font-medium ${
                        isCurrentUser 
                          ? 'bg-red-100 text-red-800 ml-2 mr-0' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {msg.volunteer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className={`flex items-baseline ${isCurrentUser ? 'justify-end' : ''}`}>
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${isCurrentUser ? 'text-red-900 order-2' : 'text-red-900'}`}>
                            {msg.volunteer_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Message options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setMessageToDelete(msg)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div 
                        className={`mt-1 p-3 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-red-50 border border-red-100' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-gray-700">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(e)
            }
          }}
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || submitting}
          className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 self-end h-[60px] px-4"
        >
          <Send />
        </Button>
      </form>
      
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send. Use Shift+Enter for a new line.
      </p>

      {/* Delete Message Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-muted p-4 my-4">
            <p className="text-sm">{messageToDelete?.message}</p>
            <div className="text-xs text-muted-foreground mt-1">
              By {messageToDelete?.volunteer_name} • {messageToDelete?.created_at && formatMessageTime(messageToDelete.created_at)}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 