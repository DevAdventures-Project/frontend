"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUserProfile } from "@/lib/api/user";
import type { UserProfile } from "@/models/User";
import { ArrowLeft, Calendar } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProfilePageProps {
  leaveScene: () => void;
}

export default function ProfilePage({ leaveScene }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: -1,
    pseudo: "",
    coins: -1,
    questsHelped: [],
    inventory: [],
  });

  useEffect(() => {
    async function getUser() {
      try {
        const fetchedUser = await fetchUserProfile();
        console.log(fetchedUser);
        setUserProfile(fetchedUser);
      } catch (error) {
        throw new Error("failed to fetch user");
      }
    }

    getUser();
  }, []);

  const ranksImage = {
    junior: "junior",
    stagiaire: "stagiaire",
    senior: "senior",
    specialiste: "boss",
  };

  const itemImage = new Map();

  itemImage.set(1, "/assets/market/rest.png");
  itemImage.set(2, "/assets/market/clothe.png");
  itemImage.set(3, "/assets/market/potion.png");
  itemImage.set(4, "/assets/market/pizza.png");
  itemImage.set(5, "/assets/market/coffee.png");

  const ranksCoins = {
    stagiaire: 5,
    junior: 10,
    senior: 20,
    specialiste: 50,
  };

  const userData = {
    name: userProfile.pseudo,
    coins: userProfile.coins,
    rank: {
      name: "senior",
      image: "/assets/ranks/boss.png",
    },
    inventory: userProfile.inventory.map((item) => {
      const items = [
        {
          id: 1,
          name: "Repos mérité",
          image: "/assets/market/rest.png",
          count: 1,
        },
        {
          id: 2,
          name: "L'habit fait le moine",
          image: "/assets/market/clothe.png",
          count: 1,
        },
        {
          id: 3,
          name: "Potion du monstre",
          image: "/assets/market/potion.png",
          count: 1,
        },
        {
          id: 4,
          name: "Pizza",
          image: "/assets/market/pizza.png",
          count: 1,
        },
        {
          id: 5,
          name: "Nuit blanche",
          image: "/assets/market/coffee.png",
          count: 1,
        },
      ];

      return items[item.itemId - 1];
    }),
    quests: userProfile.questsHelped.map((q) => {
      let coins = ranksCoins.stagiaire;
      let rankImage = "/assets/ranks/stagiaire.png";

      if (q.minimumRank === "senior") {
        coins = ranksCoins.senior;
        rankImage = "/assets/ranks/senior.png";
      }
      if (q.minimumRank === "specialiste") {
        coins = ranksCoins.specialiste;
        rankImage = "/assets/ranks/specialiste.png";
      }
      if (q.minimumRank === "junior") {
        coins = ranksCoins.junior;
        rankImage = "/assets/ranks/junior.png";
      }

      return {
        id: q.id,
        name: q.title,
        rank: q.minimumRank,
        rankImage: rankImage,
        coins: coins,
        date: new Date(q.createdAt),
        status: q.status,
      };
    }),
  };

  return (
    <div className="w-[1024px] h-[768px] p-4 font-pixel bg-[#111] min-h-screen">
      <div className="pixel-border bg-[#222] p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 border-4 border-[#5c9dca] bg-[#333] overflow-hidden">
                <Image
                  src={userData.rank.image}
                  alt="Profile Avatar"
                  width={128}
                  height={128}
                  className="w-full h-full pixel-image"
                />
              </div>
              <div className="absolute top-0 left-0 w-2 h-2 bg-[#7bb7e0]" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#7bb7e0]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#7bb7e0]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#7bb7e0]" />
            </div>

            <h1 className="text-pokemon-yellow text-xl mt-2">
              {userData.name}
            </h1>

            <div className="flex items-center gap-2 mt-1 bg-pokemon-blue-dark pixel-border-sm p-2">
              <Image
                src={userData.rank.image || "/placeholder.svg"}
                alt="Rank Badge"
                width={24}
                height={24}
                className="w-6 h-6 pixel-image"
              />
              <span className="text-pokemon-light text-xs">
                {userData.rank.name}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 bg-pokemon-yellow pixel-border-sm p-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500 pixel-coin-sm" />
              <span className="text-pokemon-dark text-xs">
                {userData.coins}
              </span>
            </div>

            <button
              type="button"
              onClick={() => leaveScene()}
              className="mt-4 pixel-button bg-pokemon-red-dark text-pokemon-light flex items-center justify-center w-full"
              aria-label="Back to game"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span className="text-[10px]">BACK TO GAME</span>
            </button>
          </div>

          <div className="flex-1 w-full">
            <Tabs
              defaultValue="inventory"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="w-full grid grid-cols-2 mb-4 pixel-border-sm bg-pokemon-blue">
                <TabsTrigger
                  value="inventory"
                  className={`text-xs ${activeTab === "inventory" ? "bg-pokemon-blue-dark text-pokemon-light" : "text-pokemon-dark"}`}
                >
                  INVENTORY
                </TabsTrigger>
                <TabsTrigger
                  value="quests"
                  className={`text-xs ${activeTab === "quests" ? "bg-pokemon-blue-dark text-pokemon-light" : "text-pokemon-dark"}`}
                >
                  QUESTS
                </TabsTrigger>
              </TabsList>

              <div className="h-[350px] bg-[#333] pixel-border-sm">
                <TabsContent value="inventory" className="mt-0 h-full">
                  <ScrollArea className="h-full p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {userData.inventory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-[#444] relative p-2 flex flex-col items-center"
                          style={{
                            boxShadow:
                              "inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3)",
                          }}
                        >
                          <div className="w-10 h-10 mb-1 relative">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="pixel-image"
                            />
                          </div>
                          <div className="text-pokemon-light text-[8px] text-center">
                            {item.name}
                          </div>
                          <div className="text-pokemon-yellow text-[8px] mt-1">
                            x{item.count}
                          </div>
                          <div className="absolute top-0 left-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute top-0 right-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#555]" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="quests" className="mt-0 h-full">
                  <ScrollArea className="h-full p-3">
                    <div className="flex flex-col gap-2">
                      {userData.quests.map((quest) => (
                        <div
                          key={quest.id}
                          className="bg-[#444] p-2 relative"
                          style={{
                            boxShadow:
                              "inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3)",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {quest.name}
                              </div>
                              <div
                                className={`
                                  ml-2 w-[60px] text-center px-2 py-0.5 text-[7px] uppercase font-bold
                                  ${
                                    quest.status === "completed"
                                      ? "bg-pokemon-green text-white"
                                      : quest.status === "open"
                                        ? "bg-pokemon-blue text-white"
                                        : quest.status === "in-progress"
                                          ? "bg-pokemon-yellow text-pokemon-dark"
                                          : "bg-pokemon-red text-white"
                                  }
                                  pixel-status
                                `}
                              >
                                {quest.status}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3 text-pokemon-blue" />
                                <span className="text-pokemon-blue text-[8px]">
                                  {new Date(quest.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                <div className="w-6 h-6 relative pixel-rank">
                                  <Image
                                    src={quest.rankImage || "/placeholder.svg"}
                                    alt={`Rank ${quest.rank}`}
                                    width={24}
                                    height={24}
                                    className="pixel-image"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-yellow-500 pixel-coin-sm" />
                                <span className="text-pokemon-yellow text-[8px]">
                                  {quest.coins}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-0 left-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute top-0 right-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#555]" />
                          <div className="absolute bottom-0 right-0 w-1 h-1 bg-[#555]" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
