import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

loadEnvFile(resolve(__dirname, '../.env.test'));
