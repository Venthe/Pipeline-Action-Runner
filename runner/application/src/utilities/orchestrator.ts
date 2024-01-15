export interface PostLog {
    [key: string]: string
    level: "info" | "debug" | "error" | "warn"
    message: string,
    date: string
}

export const postLog = (data: PostLog) => {
    // console.error("SENDING TO ORCHESTRATOR!!!", data)
}
