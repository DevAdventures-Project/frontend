"use client";
import { getRandomValues } from "node:crypto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EventBus } from "@/game/EventBus";
import { createQuest } from "@/lib/api/createQuest";
import { fetchIssues, fetchRepos } from "@/lib/api/github";
import { fetchJiraIssues, fetchJiraProjects } from "@/lib/api/jira";
import { cn } from "@/lib/utils";
import type { GithubIssue } from "@/models/Issue";
import type { JiraIssue, JiraProject } from "@/models/Jira";
import type { QuestCreate } from "@/models/QuestCreate";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ExternalLink, GithubIcon, Trello } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

interface Repo {
    id: number;
    name: string;
}

const formSchema = z.object({
    issueSource: z.enum(["github", "jira"]).optional(),
    repo_name: z.string().optional(),
    issueUrl: z.string().optional(),
    jiraProjectId: z.string().optional(),
    jiraIssueLink: z.string().optional(),
    title: z.string({ message: "Un nom de quête est requis" }).min(1),
    zone: z.string({ message: "La zone est requise" }),
    difficulty: z.string({ message: "Le niveau est requis" }),
    min: z
        .string({ message: "Le nombre de participant est requis" })
        .refine(
            (value) =>
                Number.parseInt(value) > 0 && Number.parseInt(value) <= 16,
            {
                message: "Une équipe ne peut pas dépasser 16 participants",
            }
        ),
    description: z.string().optional(),
    deadline: z
        .date({
            required_error: "Une date limite est requise",
        })
        .refine((date) => date > new Date(), {
            message: "La date limite doit être dans le futur",
        }),
});

function CreateQuest() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const [issues, setIssues] = useState<GithubIssue[]>([]);
    const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
    const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
    const [repoSelected, setRepoSelect] = useState<boolean>(false);
    const [jiraProjectSelected, setJiraProjectSelected] =
        useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("github");
    const [selectedIssue, setSelectedIssue] = useState<
        GithubIssue | JiraIssue | null
    >(null);
    const [isOpen, setIsOpen] = useState(true);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            issueSource: "github",
            deadline: undefined,
        },
    });

    const { watch, setValue } = form;
    const repoName = watch("repo_name");
    const issueUrl = watch("issueUrl");
    const jiraProjectId = watch("jiraProjectId");
    const jiraIssueLink = watch("jiraIssueLink");
    const issueSource = watch("issueSource");

    useEffect(() => {
        const getRepos = async () => {
            try {
                setRepos(await fetchRepos());
            } catch (e) {
                console.log(e);
            }
        };
        getRepos();

        const getJiraProjects = async () => {
            try {
                const jiraProjects = await fetchJiraProjects();
                setJiraProjects(jiraProjects);
            } catch (e) {
                console.log(e);
            }
        };
        getJiraProjects();
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setValue("issueSource", value as "github" | "jira");
        if (value === "github") {
            setValue("jiraProjectId", undefined);
            setValue("jiraIssueLink", undefined);
            setJiraProjectSelected(false);
        } else {
            setValue("repo_name", undefined);
            setValue("issueUrl", undefined);
            setRepoSelect(false);
        }

        setSelectedIssue(null);
    };

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
        const getJiraIssues = async () => {
            if (jiraProjectId === undefined) return;
            try {
                const issues = await fetchJiraIssues(jiraProjectId);
                setJiraIssues(issues);
            } catch (e) {
                console.log(e);
            }
        };

        if (jiraProjectId) {
            setJiraProjectSelected(true);
            getJiraIssues();
        }
    }, [jiraProjectId]);

    useEffect(() => {
        if (issueUrl) {
            const selectedIssue = issues.find(
                (issue) => issue.html_url === issueUrl
            );
            if (selectedIssue) {
                setSelectedIssue(selectedIssue);
                if (!form.getValues("title")) {
                    form.setValue("title", selectedIssue.title);
                }
            }
        }
    }, [issueUrl, issues, form]);

    useEffect(() => {
        if (jiraIssueLink) {
            const selectedIssue = jiraIssues.find(
                (issue) => issue.link === jiraIssueLink
            );
            if (selectedIssue) {
                setSelectedIssue(selectedIssue);
                if (!form.getValues("title")) {
                    form.setValue("title", selectedIssue.title);
                }
            }
        }
    }, [jiraIssueLink, jiraIssues, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let link = "";

            if (values.issueSource === "github") {
                link = values.issueUrl ?? "";
            } else if (values.issueSource === "jira") {
                link = values.jiraIssueLink ?? "";
            } else if (values.issueSource === undefined) {
                link = "";
            }

            const userId = Number(localStorage.getItem("userId"));

            if (!userId) {
                throw new Error("Not connectd");
            }

            const createQuestData: QuestCreate = {
                title: values.title,
                content: values.description ?? "Pas de description disponible",
                link: link,
                nbHelpers: Number(values.min),
                category: values.zone,
                status: "open",
                minimumRank: values.difficulty,
                authorId: userId,
                deadline: values.deadline.toISOString(),
            };

            await createQuest(createQuestData);
            toast.success("Quête créée", {
                description: "La quête a été créée avec succès.",
            });
            handleOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Error creating quest:", error);
            toast.error("Erreur", {
                description:
                    "Une erreur est survenue lors de la création de la quête.",
            });
            handleOpenChange(false);
            form.reset();
        }
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
            setSelectedIssue(null);
        }
    };

    return (
        <Dialog onOpenChange={handleOpenChange} open={isOpen}>
            <DialogContent
                className="sm:max-w-[800px]"
                showCloseButton
                backgroundTransparent={false}
            >
                <DialogHeader className="text-black">
                    <DialogTitle>Création de quête</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8 max-w-3xl mx-auto"
                    >
                        <ScrollArea className="h-[480px] w-[750px] rounded-md border px-4 text-black">
                            <div className="my-4">
                                <FormLabel className="block mb-2">
                                    Source de la tâche
                                </FormLabel>
                                <Tabs
                                    defaultValue="github"
                                    value={activeTab}
                                    onValueChange={handleTabChange}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger
                                            value="github"
                                            className="flex items-center gap-2"
                                        >
                                            <GithubIcon className="h-4 w-4" />
                                            GitHub
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="jira"
                                            className="flex items-center gap-2"
                                        >
                                            <Trello className="h-4 w-4" />
                                            Jira
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent
                                        value="github"
                                        className="mt-4 space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="repo_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Dépôt GitHub
                                                    </FormLabel>
                                                    <div className="flex items-center">
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez un dépôt GitHub" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {repos.map(
                                                                    (r) => (
                                                                        <SelectItem
                                                                            key={
                                                                                r.id
                                                                            }
                                                                            value={
                                                                                r.name
                                                                            }
                                                                        >
                                                                            {
                                                                                r.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {repoSelected && (
                                            <FormField
                                                control={form.control}
                                                name="issueUrl"
                                                render={({ field }) => (
                                                    <FormItem className="transition-all duration-300">
                                                        <FormLabel>
                                                            Issue GitHub
                                                        </FormLabel>
                                                        <div className="flex items-center">
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Sélectionnez une issue" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {issues.map(
                                                                        (
                                                                            issue
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    issue.id
                                                                                }
                                                                                value={
                                                                                    issue.html_url
                                                                                }
                                                                            >
                                                                                <div className="flex items-center gap-2 w-full pr-2">
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            issue.title
                                                                                        }
                                                                                    </span>
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="ml-auto shrink-0"
                                                                                    >
                                                                                        #
                                                                                        {
                                                                                            issue.number
                                                                                        }
                                                                                    </Badge>
                                                                                </div>
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="jira"
                                        className="mt-4 space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="jiraProjectId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Projet Jira
                                                    </FormLabel>
                                                    <div className="flex items-center">
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez un projet Jira" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {jiraProjects.map(
                                                                    (
                                                                        project
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                project.id
                                                                            }
                                                                            value={
                                                                                project.id
                                                                            }
                                                                        >
                                                                            {
                                                                                project.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {jiraProjectSelected && (
                                            <FormField
                                                control={form.control}
                                                name="jiraIssueLink"
                                                render={({ field }) => (
                                                    <FormItem className="transition-all duration-300">
                                                        <FormLabel>
                                                            Ticket Jira
                                                        </FormLabel>
                                                        <div className="flex items-center">
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Sélectionnez un ticket" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {jiraIssues.map(
                                                                        (
                                                                            issue
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    issue.link
                                                                                }
                                                                                value={
                                                                                    issue.link
                                                                                }
                                                                            >
                                                                                <div className="flex items-center gap-2 w-full pr-2">
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            issue.title
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        )
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {selectedIssue && (
                                <Card className="my-4 bg-amber-100 border-amber-300">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">
                                                    {"title" in selectedIssue
                                                        ? selectedIssue.title
                                                        : "Pas de titre"}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {"html_url" in
                                                    selectedIssue ? (
                                                        <a
                                                            href={
                                                                selectedIssue.html_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            Voir sur GitHub{" "}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={
                                                                selectedIssue.link
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            Voir sur Jira{" "}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </p>
                                            </div>
                                            <Badge>
                                                {"html_url" in selectedIssue
                                                    ? "GitHub"
                                                    : "Jira"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="my-4">
                                        <FormLabel>Nom de la quête</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Titre de la quête"
                                                type="text"
                                                {...field}
                                            />
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
                                            <FormLabel>
                                                Zone de la quête
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez une zone" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="javascript">
                                                        JavaScript
                                                    </SelectItem>
                                                    <SelectItem value="Cobol">
                                                        Cobol
                                                    </SelectItem>
                                                    <SelectItem value="Scratch">
                                                        Scratch
                                                    </SelectItem>
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
                                            <FormLabel>
                                                Niveau minimum requis
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Sélectionnez un niveau" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="junior">
                                                        Junior
                                                    </SelectItem>
                                                    <SelectItem value="senior">
                                                        Senior
                                                    </SelectItem>
                                                    <SelectItem value="linus">
                                                        Linus Torvald
                                                    </SelectItem>
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
                                            <FormLabel>
                                                Nombre max de participant
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    min={1}
                                                    maxLength={16}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="deadline"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date limite</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "PPP"
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Choisir une
                                                                    date
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date < new Date() ||
                                                            date <
                                                                new Date(
                                                                    "1900-01-01"
                                                                )
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
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
                                        <FormLabel>
                                            Description de la quête
                                        </FormLabel>
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
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="secondary"
                                className="border-b-black bg-amber-700"
                                onClick={() => handleOpenChange(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" className="bg-blue-500">
                                Créer
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default CreateQuest;
