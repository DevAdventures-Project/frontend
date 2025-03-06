import type { JiraIssue, JiraProject } from "@/models/Jira";

const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || "";

export const fetchJiraProjects = async (): Promise<JiraProject[]> => {
  const jiraProjectsUrl = `${apiUrl}/jira`;
  const response = await fetch(jiraProjectsUrl);
  return await response.json();
};

export const fetchJiraIssues = async (
  projectName: string,
): Promise<JiraIssue[]> => {
  const jiraIssueApiRoute = `${apiUrl}/jira/${projectName}`;
  const response = await fetch(jiraIssueApiRoute);
  return await response.json();
};
