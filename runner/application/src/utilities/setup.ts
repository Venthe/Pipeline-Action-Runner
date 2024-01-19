import { shellMany } from "@pipeline/process";
import { ContextEnvironmentVariables, DebugEnvironmentVariables, PipelineEnvironmentVariables, SystemEnvironmentVariables } from "@pipeline/types";
import fs from 'fs';
import { JobData } from "../types";
import * as YAML from 'js-yaml';

export const setup = async (env: ContextEnvironmentVariables) => {
    await configureGit();

    setupSSHKeyForVersionControl(env);
    await addVersionControlToKnownHosts(env);

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

function setupSSHKeyForVersionControl(env: DebugEnvironmentVariables) {
    if (env.__DEBUG_SSH_PRIVATE_KEY) {
        fs.mkdirSync("/root/.ssh/", { recursive: true });
        fs.writeFileSync("/root/.ssh/id_rsa", Buffer.from(env.__DEBUG_SSH_PRIVATE_KEY, 'base64'));
    }
}

async function addVersionControlToKnownHosts(env: SystemEnvironmentVariables) {
    await shellMany([
        `ssh-keyscan -t rsa -p ${env.PIPELINE_VERSION_CONTROL_SSH_PORT} -H ${env.PIPELINE_VERSION_CONTROL_SSH_HOST} >> /root/.ssh/known_hosts`,
        'chmod u=rwx,o=,g= /root/.ssh/id_rsa'
    ]);
}

export async function loadJobData(env: PipelineEnvironmentVariables & SystemEnvironmentVariables): Promise<JobData> {
    if (process.env.__DEBUG_JOB_DATA) {
        return YAML.load(Buffer.from(process.env.__DEBUG_JOB_DATA, 'base64').toString()) as JobData
    }

    return JSON.parse(await fetch(`${env.PIPELINE_ORCHESTRATOR_URL}/workflow-executions/${env.PIPELINE_WORKFLOW_EXECUTION_ID}/jobs/${env.PIPELINE_JOB_NAME}`)
        .then(e => e.text())
        .catch(rejected => {
            console.log(rejected);
        }) as string) as JobData
}

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
