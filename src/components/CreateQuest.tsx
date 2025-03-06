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
import { fetchIssues, fetchRepos } from "@/lib/api/github";
import type { Issue } from "@/models/Issue";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, GithubIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Message, useForm } from "react-hook-form";
import * as z from "zod";

interface Repo {
  id: number;
  name: string;
}

const formSchema = z.object({
  repo_name: z.string().optional(),
  issueUrl: z.string().optional(),
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
});

function CreateQuest() {
  const [respos, setRepos] = useState<Repo[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [repoSelected, setRepoSelect] = useState<boolean>(false);

  useEffect(() => {
    const getRepos = async () => {
      try {
        setRepos(await fetchRepos());
      } catch (e) {
        console.log(e);
      }
    };
    getRepos();
  }, []);

  function handleRepoSelected() {
    console.log("hlelo");
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { watch } = form;
  const repoName = watch("repo_name");
  const issueUrl = watch("issueUrl");

  useEffect(() => {
    const getIssues = async () => {
      if (repoName === undefined) return;
      try {
        const issues = await fetchIssues(repoName);
        setIssues(issues);
      } catch (e) {
        console.log(e);
      }
    };

    if (repoName) {
      setRepoSelect(true);
      getIssues();
    }
  }, [repoName]);

  useEffect(() => {
    if (issueUrl) {
      console.log(issueUrl);
    }
  }, [issueUrl]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  console.log(`truc = ${repoSelected}`);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Ajouter une quête</Button>
      </DialogTrigger>
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
                name="repo_name"
                render={({ field }) => (
                  <FormItem className="my-4">
                    <div className="flex gap-2">
                      <GithubIcon />
                      <FormLabel>Depot Github</FormLabel>
                    </div>
                    <div className="flex items-center">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionnez un dépot github" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {respos.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueUrl"
                render={({ field }) => (
                  <FormItem
                    className={`my-4 transition-opacity duration-500 ${
                      repoSelected ? "opacity-100" : "opacity-0"
                    } ${repoSelected ? "block" : "hidden"}`}
                  >
                    <FormLabel>Issue Github</FormLabel>
                    <div className="flex items-center">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select issue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issues.map((issue) => (
                            <div key={issue.id}>
                              <SelectItem value={issue.html_url}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{issue.title} </span>
                                </div>
                              </SelectItem>
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </ScrollArea>
            <Button type="submit">Créer</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateQuest;
