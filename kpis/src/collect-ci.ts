import type { FetchFn } from './collect-http.ts';

interface CiConfig {
  githubToken: string;
  githubRepo: string;
}

// KPI 10: conclusion of the latest finished ci.yml run on any branch.
export async function collectCiKpi(
  { githubToken, githubRepo }: CiConfig,
  { fetchImpl = fetch }: { fetchImpl?: FetchFn } = {},
): Promise<number> {
  const url =
    `https://api.github.com/repos/${githubRepo}/actions/workflows/ci.yml/runs` +
    '?status=completed&per_page=1';

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`GitHub API answered ${response.status}`);
  }

  const { workflow_runs: runs } = (await response.json()) as {
    workflow_runs?: { conclusion: string | null }[];
  };

  // No finished run is real data: 0, and it is still reported.
  return runs?.[0]?.conclusion === 'success' ? 1 : 0;
}
