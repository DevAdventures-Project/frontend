"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventBus } from "@/game/EventBus";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  title: z.string({ message: "Un nom de quête est requis" }).min(1),
  zone: z.string({ message: "La zone est requise" }),
  difficulty: z.string({ message: "Le niveau est requis" }),
  min: z
    .string({ message: "Le nombre de participant est requis" })
    .refine(
      (value) => Number.parseInt(value) > 0 && Number.parseInt(value) <= 16,
      {
        message: "Une équipe ne peut pas dépasser 16 participants",
      },
    ),
  description: z.string().optional(),
  link: z.string({ message: "Le lien est requis" }),
});

function CreateQuest() {
  const [isOpen, setIsOpen] = useState(true);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    handleOpenChange(false);
  }

  useEffect(() => {
    const handleCloseCreateQuest = () => {
      setIsOpen(false);
    };

    EventBus.on("close-create-quest", handleCloseCreateQuest);

    return () => {
      EventBus.off("close-create-quest", handleCloseCreateQuest);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      EventBus.emit("quest-ui-closed");
      form.reset();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader className="text-black">
          <DialogTitle>Création de quête</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 max-w-3xl mx-auto"
          >
            <ScrollArea className="h-[480px] w-[750px] rounded-md border px-4 text-black">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="my-4">
                    <FormLabel>Nom de la quête</FormLabel>
                    <FormControl>
                      <Input placeholder="title" type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4 my-4">
                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone de la quête</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionnez une zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="Cobol">Cobol</SelectItem>
                          <SelectItem value="Scratch">Scratch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau minimum requis</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionnez un niveau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="linus">Linus Torvald</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre max de participant</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="my-4">
                    <FormLabel>Description de la quête</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description de la quête"
                        className="h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem className="my-4">
                    <FormLabel>Lien</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Le lien vers l'issue/ticket"
                        type="text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ScrollArea>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateQuest;
