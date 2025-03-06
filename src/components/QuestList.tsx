"use client";

import type React from "react";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Sword, Trophy, User } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Quest } from "@/models/Quest";
import { calculateRemainingTime } from "@/lib/calculateRemainingTime";

// Sample quest data
const quests: Quest[] = [
  {
    id: 1,
    title: "The Lost Artifact",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras id sem id velit vehicula facilisis et eget sem. Praesent facilisis tellus pulvinar pretium luctus. Suspendisse et pulvinar arcu, at blandit arcu. Sed convallis metus ut neque dapibus, in lacinia magna scelerisque. Praesent eget viverra orci. Cras consequat ex eget magna finibus, id laoreet odio laoreet. Vivamus sit amet odio nulla. Ut porta ipsum quis tortor sollicitudin, sit amet placerat est mattis. Donec sit amet tortor vitae tortor sodales pharetra. Duis ornare in sapien ac consectetur. Suspendisse feugiat augue id bibendum placerat. Aenean ut tortor at augue varius eleifend. Etiam nec venenatis sapien, eget fermentum leo. Vivamus varius felis ut nisl sodales sagittis a et metus. Quisque quis arcu fermentum, vulputate leo ut, aliquet metus. Donec placerat pharetra metus, vitae vehicula mi. In placerat venenatis orci lacinia pharetra. Nam dignissim sit amet dui vel vehicula. Suspendisse tristique eget neque in varius. Quisque tincidunt gravida dui at vehicula. Nam efficitur diam ac nunc ullamcorper, tincidunt laoreet augue vestibulum. Quisque bibendum lectus sed lectus vehicula, et pulvinar enim placerat. Nam tempus leo eget massa placerat consectetur. Maecenas lobortis, velit vel rutrum lacinia, nisi turpis ultrices augue, at molestie elit magna ac turpis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel odio vel sapien tristique porttitor. Integer rhoncus lectus eu odio ullamcorper, vel consequat arcu interdum. Cras id maximus mauris. Donec in urna nec arcu mollis dictum vel lacinia libero. Maecenas elementum elementum rutrum. Etiam non odio malesuada, tristique ex quis, tristique sapien. Ut velit risus, pulvinar ac facilisis non, semper at mauris. Nam vitae lorem lorem. Ut laoreet, elit in aliquam condimentum, neque ante pretium purus, a auctor ligula augue sed quam. Sed blandit est diam, sit amet suscipit nulla ultrices consectetur. Pellentesque eget tempus odio. Integer non lorem pulvinar, porttitor nibh nec, vestibulum dui. Sed a erat vitae tortor placerat consectetur. Sed at felis tincidunt, iaculis justo dapibus, sollicitudin augue. Integer eu sollicitudin mauris, ut scelerisque enim. Phasellus tincidunt neque dui. Duis sit amet facilisis odio. Nullam nec ornare magna. Curabitur maximus eros vitae aliquam ultrices. Donec sit amet justo fringilla, interdum massa eu, dapibus diam. Etiam auctor dapibus leo sollicitudin blandit. Suspendisse rhoncus aliquet turpis, quis porta ex ornare et. Nunc sed enim non mi suscipit varius at at neque.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Cobol",
    minimumRank: "Senior",
    deadline: new Date("2025-03-07T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
  {
    id: 2,
    title: "The Lost Artifact",
    content:
      "Recover the ancient artifact from the abandoned temple in the forest of shadows.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Javascript",
    minimumRank: "Senior",
    deadline: new Date("2025-03-06T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
  {
    id: 3,
    title: "The Lost Artifact",
    content:
      "Recover the ancient artifact from the abandoned temple in the forest of shadows.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Cobol",
    minimumRank: "Senior",
    deadline: new Date("2025-03-06T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
  {
    id: 4,
    title: "The Lost Artifact",
    content:
      "Recover the ancient artifact from the abandoned temple in the forest of shadows.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Scratch",
    minimumRank: "Senior",
    deadline: new Date("2025-03-06T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
  {
    id: 5,
    title: "The Lost Artifact",
    content:
      "Recover the ancient artifact from the abandoned temple in the forest of shadows.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Cobol",
    minimumRank: "Senior",
    deadline: new Date("2025-03-06T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
  {
    id: 6,
    title: "The Lost Artifact",
    content:
      "Recover the ancient artifact from the abandoned temple in the forest of shadows.",
    link: "https://github.com/DevAdventures-Project/frontend",
    nbHelpers: 3,
    category: "Cobol",
    minimumRank: "Senior",
    deadline: new Date("2025-03-06T12:11:38.801Z"),
    createdAt: new Date("2025-03-06T12:11:38.801Z"),
    authorId: "Roger",
  },
];

function QuestDialog() {
  const [selectedQuest, setSelectedQuest] = useState<(typeof quests)[0] | null>(
    null,
  );

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
          <div className="flex-1 overflow-hidden">
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
                      <Button className="w-[50%]" variant="success">
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
