const GIB = 1024 ** 3;

export type KpiEnv = 'dev' | 'qa' | 'prod';

export interface PublishCredentials {
  supabaseUrl: string;
  publishableKey: string;
  projectKey: string;
}

export interface PublishTarget extends PublishCredentials {
  env: KpiEnv;
}

export interface Config {
  env: KpiEnv;
  dryRun: boolean;
  backendUrl: string;
  neonUrl: string;
  githubToken: string;
  githubRepo: string;
  storageLimitBytes: number;
  publishing?: PublishCredentials;
}

type Environment = Record<string, string | undefined>;

function required(env: Environment, name: string): string {
  const value = env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function parseArgs(argv: string[]): { env?: string; dryRun: boolean } {
  const args: { env?: string; dryRun: boolean } = { dryRun: false };

  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--dry-run') args.dryRun = true;
    else if (argv[index] === '--env') args.env = argv[++index];
  }

  return args;
}

function isKpiEnv(value: string): value is KpiEnv {
  return value === 'dev' || value === 'qa' || value === 'prod';
}

// A dry run only measures, so it does not need the publishing credentials.
export function loadConfig(
  env: Environment = process.env,
  argv: string[] = process.argv.slice(2),
): Config {
  const args = parseArgs(argv);
  const kpiEnv = args.env ?? env.KPI_ENV ?? 'prod';

  if (!isKpiEnv(kpiEnv)) {
    throw new Error(`Invalid environment "${kpiEnv}": use dev, qa or prod`);
  }

  const config: Config = {
    env: kpiEnv,
    dryRun: args.dryRun,
    backendUrl: required(env, 'BACKEND_URL').replace(/\/+$/, ''),
    neonUrl: required(env, 'NEON_READONLY_URL'),
    githubToken: required(env, 'GITHUB_TOKEN'),
    githubRepo: env.GITHUB_REPOSITORY_KPI ?? 'proyecto-zest/zest',
    storageLimitBytes: Number(env.NEON_STORAGE_LIMIT_BYTES ?? GIB),
  };

  if (!args.dryRun) {
    config.publishing = {
      supabaseUrl: required(env, 'SUPABASE_URL').replace(/\/+$/, ''),
      publishableKey: required(env, 'SUPABASE_PUBLISHABLE_KEY'),
      projectKey: required(env, 'PROJECT_KEY'),
    };
  }

  return config;
}
