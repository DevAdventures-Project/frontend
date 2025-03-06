"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { calculateRemainingTime } from "@/lib/calculateRemainingTime";
import type { Quest } from "@/models/Quest";
import { Clock, MapPin, Sword, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getQuests } from "../lib/api/getQuests";
import { joinQuest } from "../lib/api/joinQuest";

function QuestDialog() {
  const [selectedQuest, setSelectedQuest] = useState<(typeof quests)[0] | null>(
    null,
  );
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    async function fetchQuests() {
      const fetchedQuests = await getQuests();
      setQuests(fetchedQuests);
    }

    fetchQuests();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Voir les quêtes</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1200px] text-black">
        <div className="mx-auto flex max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-lg md:flex-row">
          {/* Left sidebar - Quest list */}
          <div className="w-full border-r md:w-80">
            <div className="p-4">
              <h2 className="text-xl font-bold">Liste des quêtes</h2>
            </div>
            <Separator />
            <ScrollArea className="h-[calc(600px-57px)]">
              <div className="p-2">
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`mb-2 cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent/50 ${
                      selectedQuest?.id === quest.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedQuest(quest)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedQuest(quest);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{quest.title}</h3>
                    </div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      <span>{quest.category}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {quest.minimumRank}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{calculateRemainingTime(quest.deadline)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right panel - Quest details */}
          <div className="flex-1 overflow-hidden w-[800px]">
            {selectedQuest ? (
              <ScrollArea className="h-[600px]">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {selectedQuest.title}
                    </h2>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">Informations</h3>

                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Zone</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedQuest.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Donneur de quête</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedQuest.authorId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Temps restant</p>
                        <p className="text-sm text-muted-foreground">
                          {calculateRemainingTime(selectedQuest.deadline)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Sword className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Niveau minimum</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedQuest.minimumRank}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold">
                    Description de la quête
                  </h3>

                  <div className="mb-6 rounded-lg bg-muted p-4">
                    <p>{selectedQuest.content}</p>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-semibold">Récompenses</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">Expérience</p>
                          <p className="text-sm text-muted-foreground">50 XP</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">Points</p>
                          <p className="text-sm text-muted-foreground">
                            50 points
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="my-6 flex items-center justify-center">
                      <Button
                        className="w-[50%]"
                        variant="success"
                        onClick={() => joinQuest(selectedQuest.id)}
                      >
                        Accepter la quête
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center w-[800px]">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    Aucune quête sélectionnez
                  </h3>
                  <p className="text-muted-foreground">
                    Sélectionnez une quête pour avoir plus d'informations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuestDialog;
