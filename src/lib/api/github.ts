const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || "";

export const fetchRepos = async () => {
  const githubReposUrl = `${apiUrl}/github/repos`;

  const response = await fetch(githubReposUrl);
  return await response.json();
};

export const fetchIssues = async (repoName: string) => {
  const githubIssuesApiRoute = `${apiUrl}/github/issues/${repoName}`;

  const response = await fetch(githubIssuesApiRoute);
  return await response.json();
};
