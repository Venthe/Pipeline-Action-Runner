import { shellMany } from "@pipeline/process";
import { ContextEnvironmentVariables } from "@pipeline/types";

export const setup = async (env: ContextEnvironmentVariables) => {
    await configureGit();

    createRequiredDirectories(env)
}

const configureGit = async () => {
    await shellMany([
        `git config --global ssh.variant ssh`,
        'git config --global init.defaultBranch main',
        'git config --global advice.detachedHead false',
        `git config --global user.name "Action runner"`,
        `git config --global user.email "jenkins@home.arpa"`,
        `git config --global --add safe.directory ${process.cwd()}`
    ]);
};

async function createRequiredDirectories(env: ContextEnvironmentVariables) {
    await shellMany(
        getRunnerDirectories(env).map((directory) => `mkdir --parents ${directory}`),
        { silent: true }
    );
}

const getRunnerDirectories = (env: ContextEnvironmentVariables): string[] =>
    Object.keys(env)
        .filter(
            (key) =>
                key.toLowerCase().startsWith('RUNNER_'.toLowerCase()) &&
                key.toLowerCase().endsWith('_DIRECTORY'.toLowerCase())
        )
        .map((key) => env[key])
        .filter((value) => value !== undefined) as string[];
