"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { calculateRemainingTime } from "@/lib/calculateRemainingTime";
import type { Quest } from "@/models/Quest";
import {
  Clock,
  MapPin,
  Sword,
  User,
  Users,
  Link2,
  BrainCircuit,
  Coins,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EventBus } from "../game/EventBus";
import { getQuests } from "../lib/api/getQuests";
import { joinQuest } from "../lib/api/joinQuest";
import { deleteQuest } from "@/lib/api/deleteQuest";
import { quitQuest } from "@/lib/api/quitQuest";

function QuestList() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string>(
    localStorage.getItem("accessToken") || "",
  );
  const [pseudo, setPseudo] = useState<string>(
    localStorage.getItem("pseudo") || "",
  );
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    async function fetchQuests() {
      const userId = localStorage.getItem("userId");
      if (userId) {
        setUserId(Number.parseInt(userId));
        const fetchedQuests = await getQuests(Number.parseInt(userId));
        setQuests(fetchedQuests);
      }
    }

    fetchQuests();

    const handleCloseQuestList = () => {
      setIsOpen(false);
    };

    EventBus.on("close-quest-list", handleCloseQuestList);

    return () => {
      EventBus.off("close-quest-list", handleCloseQuestList);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      EventBus.emit("quest-ui-closed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
                          {selectedQuest.author.pseudo}
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

                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Membres</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedQuest.helpers.length} /{" "}
                          {selectedQuest.nbHelpers}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <Link2 className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Lien</p>
                        <p className="text-sm text-muted-foreground capitalize truncate">
                          <a
                            href={selectedQuest.link}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {selectedQuest.link}
                          </a>
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
                        <BrainCircuit className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Expérience</p>
                          <p className="text-sm text-muted-foreground">50 XP</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Coins className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-medium">Points</p>
                          <p className="text-sm text-muted-foreground">
                            50 points
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="my-6 flex items-center justify-center">
                      {selectedQuest.author.id === userId ? (
                        <Button
                          className="w-[50%]"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              const success = await deleteQuest(
                                selectedQuest.id,
                              );
                              if (success) {
                                setQuests((prevQuests) =>
                                  prevQuests.filter(
                                    (quest) => quest.id !== selectedQuest.id,
                                  ),
                                );
                                // Reset the selected quest
                                setSelectedQuest(null);
                              }
                            } catch (error) {
                              console.error("Failed to delete quest:", error);
                            }
                          }}
                        >
                          Retirer la quête
                        </Button>
                      ) : selectedQuest.helpers.some(
                          (helper) => helper.id === userId,
                        ) ? (
                        <Button
                          className="w-[50%]"
                          variant="warning"
                          onClick={async () => {
                            try {
                              const success = await quitQuest(
                                selectedQuest.id,
                                token,
                              );
                              if (success) {
                                setQuests((prevQuests) =>
                                  prevQuests.map((quest) => {
                                    if (quest.id === selectedQuest.id) {
                                      quest.helpers = quest.helpers.filter(
                                        (helper) => helper.id !== userId,
                                      );
                                    }
                                    return quest;
                                  }),
                                );
                              }
                            } catch (error) {
                              console.error("Failed to quit quest:", error);
                            }
                          }}
                        >
                          Quitter la quête
                        </Button>
                      ) : (
                        <Button
                          className="w-[50%]"
                          variant="success"
                          onClick={async () => {
                            try {
                              const success = await joinQuest(
                                selectedQuest.id,
                                token,
                              );
                              if (success) {
                                setQuests((prevQuests) =>
                                  prevQuests.map((quest) => {
                                    if (quest.id === selectedQuest.id) {
                                      if (userId !== null) {
                                        quest.helpers.push({
                                          id: userId,
                                          pseudo: pseudo,
                                        });
                                      }
                                    }
                                    return quest;
                                  }),
                                );
                              }
                            } catch (error) {
                              console.error("Failed to join quest:", error);
                            }
                          }}
                        >
                          Accepter la quête
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center w-[800px]">
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    Aucune quête sélectionnée
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

export default QuestList;
