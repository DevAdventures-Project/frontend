"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import { Toaster, toast } from "sonner";

interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  purchased: boolean;
}

export default function Marketplace() {
  const [username] = useState("PixelTrainer");
  const [coins, setCoins] = useState(500);
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: "Repos mérité",
      description: "1 jour de congé",
      price: 5000,
      image: "/assets/market/rest",
      purchased: false,
    },
    {
      id: 2,
      name: "L'habit fait le moine",
      description: "Un super sweat Code Works",
      price: 800,
      image: "/assets/market/clothe",
      purchased: false,
    },
    {
      id: 3,
      name: "Potion du monstre",
      description: "Une canette monster offerte",
      price: 40,
      image: "/assets/market/potion",
      purchased: false,
    },
    {
      id: 4,
      name: "Pizza",
      description: "Une pizza offerte",
      price: 1200,
      image: "/assets/market/pizza",
      purchased: false,
    },
    {
      id: 5,
      name: "Nuit blanche",
      description: "Prend du café (ou la monster de janin)",
      price: 20,
      image: "/assets/market/coffee",
      purchased: false,
    },
  ]);

  const buyItem = async (item: Item) => {
    try {
      const success = true;

      if (success) {
        setCoins(coins - item.price);
        setItems(
          items.map((i) => (i.id === item.id ? { ...i, purchased: true } : i)),
        );
        toast.success(
          `Vous avez acheter ${item.name} pour ${item.price} coins`,
        );
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'achat", {
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-[1100px] bg-pokemon-light text-black bg-white font-pixel p-4 font-pixe">
      <div className="max-w-4xl mx-auto">
        <div className="pixel-border bg-pokemon-accent p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl text-pokemon-red">PIXEL MARKETPLACE</h1>
            <div className="flex items-center gap-4">
              <div className="text-lg text-pokemon-dark">{username}</div>
              <div className="flex items-center bg-pokemon-yellow px-3 py-1 pixel-border-sm">
                <div className="w-6 h-6 bg-yellow-400 rounded-full mr-2 pixel-coin" />
                <span className="text-pokemon-dark font-bold">{coins}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="pixel-border bg-pokemon-light p-0 overflow-hidden"
            >
              <div className="flex">
                <div className="w-24 h-24 bg-pokemon-accent p-2 flex items-center justify-center">
                  <Image
                    src={`${item.image}.png`}
                    alt="Icon"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-bold text-pokemon-dark">
                      {item.name}
                    </h3>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full mr-1 pixel-coin-sm" />
                      <span className="text-pokemon-dark">{item.price}</span>
                    </div>
                  </div>
                  <p className="text-sm text-pokemon-text mt-1 mb-2">
                    {item.description}
                  </p>
                  {item.purchased ? (
                    <div className="bg-pokemon-green text-white text-xs px-2 py-1 inline-block pixel-border-sm">
                      PURCHASED
                    </div>
                  ) : (
                    <Button
                      onClick={() => buyItem(item)}
                      disabled={coins < item.price || item.purchased}
                      className={`pixel-button ${
                        coins < item.price
                          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                          : "bg-pokemon-red hover:bg-pokemon-red-dark text-white"
                      }`}
                    >
                      BUY
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
