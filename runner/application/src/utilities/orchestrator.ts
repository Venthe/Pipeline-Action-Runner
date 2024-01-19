import { ContextSnapshot, JobStatus, JobOutput } from "@pipeline/types"

export interface PostLog {
    [key: string]: string
    level: "info" | "debug" | "error" | "warn"
    message: string,
    date: string
}

export const postLog = (data: PostLog) => {
    // console.error("SENDING TO ORCHESTRATOR!!!", data)
}

export const updateJobStatus = async (context: ContextSnapshot, status: JobStatus, outcome?: JobOutput) => {
    await updateJobStatusInternal(context.internal.orchestratorUrl, context.env.PIPELINE_WORKFLOW_EXECUTION_ID, context.env.PIPELINE_JOB_NAME, status, outcome)
}

export const updateJobStatusInternal = async (orchestratorUrl, PIPELINE_WORKFLOW_EXECUTION_ID, PIPELINE_JOB_NAME, status: JobStatus, outcome?: JobOutput) => {
    // console.log(`Calling orchestrator with job status update: ${status}`)
    if (process.env.__DEBUG_DONT_UPDATE_STATUS) {
        return
    }
    await fetch(`${orchestratorUrl}/workflow-executions/${PIPELINE_WORKFLOW_EXECUTION_ID}/jobs/${PIPELINE_JOB_NAME}/update-status`, {headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },method: "POST", body: JSON.stringify({status, outcome})})
}

export const updateStepStatus = async (context: ContextSnapshot, stepIndex: number, status: JobStatus) => {
    // console.log(`Calling orchestrator with step status update: ${status}`)
    if (context.env.__DEBUG_DONT_UPDATE_STATUS) {
        return
    }
    await fetch(`${context.internal.orchestratorUrl}/workflow-executions/${context.env.PIPELINE_WORKFLOW_EXECUTION_ID}/jobs/${context.env.PIPELINE_JOB_NAME, status}/steps/${stepIndex}/update-status`, {method: "POST", body: status})
}