export const FOXCLAW_CLI_ENV_VAR = "FOXCLAW_CLI";
export const FOXCLAW_CLI_ENV_VALUE = "1";

export function markOpenClawExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [FOXCLAW_CLI_ENV_VAR]: FOXCLAW_CLI_ENV_VALUE,
  };
}

export function ensureOpenClawExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[FOXCLAW_CLI_ENV_VAR] = FOXCLAW_CLI_ENV_VALUE;
  return env;
}
