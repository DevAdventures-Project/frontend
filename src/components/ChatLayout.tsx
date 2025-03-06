"use client";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import type { Message } from "@/models/Message";
import type { UserChat } from "@/models/User";
import { useContext, useEffect, useState } from "react";
import GameChat from "./GameChat";
import ChatToggleButton from "./ui/ChatToggle";

export default function ChatLayout() {
  const [chatVisible, setChatVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const wsClient = useContext(WebSocketContext);
  const currentUser: UserChat = {
    id: 1,
    pseudo: "Player1",
  };

  wsClient.on("message", (data: string) => {
    const newMessage: Message = JSON.parse(data);
    setMessages([...messages, newMessage]);
  });
  // const otherUsers: UserChat[] = [
  //   { id: 2, pseudo: "Player2" },
  //   { id: 3, pseudo: "Player3" },
  //   { id: 4, pseudo: "GameMaster" },
  // ];

  // useEffect(() => {
  //   const initialMessages: Message[] = [
  //     {
  //       id: 1,
  //       content: "Welcome to the game chat!",
  //       author: { id: 4, pseudo: "GameMaster" },
  //       room: "General",
  //       createdAt: new Date(Date.now() - 3600000).toISOString(),
  //     },
  //     {
  //       id: 2,
  //       content: "Hey everyone, I just joined!",
  //       author: { id: 2, pseudo: "Player2" },
  //       room: "General",
  //       createdAt: new Date(Date.now() - 1800000).toISOString(),
  //     },
  //     {
  //       id: 3,
  //       content: "Good luck and have fun!",
  //       author: { id: 3, pseudo: "Player3" },
  //       room: "General",
  //       createdAt: new Date(Date.now() - 900000).toISOString(),
  //     },
  //   ];

  //   setMessages(initialMessages);
  // }, []);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      content,
      author: currentUser,
      createdAt: new Date().toISOString(),
    };
    wsClient.emit("message", JSON.stringify(newMessage));

    // setMessages([...messages, newMessage]);

    //   if (Math.random() > 0.5) {
    //     setTimeout(
    //       () => {
    //         const randomUser =
    //           otherUsers[Math.floor(Math.random() * otherUsers.length)];
    //         const responses = [
    //           "Nice one!",
    //           "I agree with that.",
    //           "Let's move to the next area.",
    //           "Watch out for enemies!",
    //           "Need some help over here!",
    //           "Good job team!",
    //         ];

    //         const responseMessage: Message = {
    //           id: messages.length + 2,
    //           content: responses[Math.floor(Math.random() * responses.length)],
    //           author: randomUser,
    //           room: "General",
    //           createdAt: new Date().toISOString(),
    //         };

    //         setMessages((prev) => [...prev, responseMessage]);
    //       },
    //       1000 + Math.random() * 2000,
    //     );
    //   }
  };

  const toggleChatVisibility = () => {
    setChatVisible(!chatVisible);
  };

  return (
    <div className="relative w-[1024px] h-[768px] overflow-hidden">
      <GameChat
        isVisible={chatVisible}
        currentUser={currentUser}
        room="General"
        onSendMessage={handleSendMessage}
        messages={messages}
      />

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />
    </div>
  );
}
