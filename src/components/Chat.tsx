"use client"

import { formatDateChat } from "@/lib/prettyFormats"
import type { Message } from "@/models/Message"
import { useState, useEffect, useRef } from "react"
import { Minimize2, Maximize2 } from "lucide-react"

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [nextId, setNextId] = useState<number>(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const maximizeChat = () => {
    setIsMinimized(false)
    // When maximizing, scroll to bottom if we were at bottom before
    if (isAtBottom) {
      setTimeout(scrollToBottom, 0)
    }
  }

  const checkIfAtBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10
    setIsAtBottom(isAtBottom)
  }

  const scrollToBottom = () => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkIfAtBottom)
      return () => container.removeEventListener("scroll", checkIfAtBottom)
    }
  }, [])

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
  }, [messages, isAtBottom])

  useEffect(() => {
    const addMessage = () => {
      const newMessage: Message = {
        id: nextId,
        content: "coucou je suis un message blablabl oui j'aime le pain cool ok bien vas y pas de changce",
        author: {
          id: 0,
          pseudo: "johnDoe43",
        },
        room: "qqpart",
        createdAt: "2025-03-06T09:50:08.937Z",
      }
      setNextId((prevId) => prevId + 1)
      setMessages((prevMessages) => [...prevMessages, newMessage])
    }

    const intervalId = setInterval(addMessage, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [nextId])

  if (isMinimized) {
    return (
      <div className="flex flex-col w-[400px] max-w-md mx-auto">
        <button
          onClick={maximizeChat}
          className="flex items-center justify-between w-full p-3 bg-orange-300/90 border rounded-t-md hover:bg-orange-300 transition-colors"
        >
          <span className="font-medium">Chat</span>
          <Maximize2 size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-[400px] h-[500px] max-w-md mx-auto bg-orange-300/90 border">
      <div className="flex items-center justify-between p-2 border-b bg-orange-400/50">
        <h3 className="font-medium">Chat</h3>
        <button
          onClick={minimizeChat}
          className="p-1 rounded-md hover:bg-orange-300 transition-colors"
          aria-label="Minimize chat"
        >
          <Minimize2 size={18} />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:bg-gray-700
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
      >
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className="text-gray-800 text-xs">
              [{formatDateChat(message.createdAt)}] <span className="font-bold">{message.author.pseudo}: </span>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex p-2">
        <input
          type="text"
          className="flex-1 p-2 border text-xs text-black bg-gray-100 rounded-lg placeholder:text-gray-300"
          placeholder="..."
        />
        {!isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="ml-2 px-2 py-1 bg-gray-200 text-amber-950 rounded-lg text-xs flex items-center cursor-pointer"
          >
            ↓
          </button>
        )}
      </div>
    </div>
  )
}

export default Chat

