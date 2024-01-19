import { shellMany } from "@pipeline/process";

export const setup = async () => {
    await configureGit();
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
