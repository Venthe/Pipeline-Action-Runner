#!/usr/bin/env bash

set -o errexit
set -o pipefail

#Links (Local)
#_GERRIT_URL="ssh://admin@host.docker.internal:29418"
#_NEXUS_URL="http://host.docker.internal:8081/repository/raw"
#_DOCKER_URL="http://host.docker.internal:5000"
#_DOCKER_TAG="host.docker.internal:5000"

NAMESPACE="infrastructure"
LATEST_TAG="latest"

CURRENT_VERSION_TAG=`git rev-parse HEAD`
CURRENT_DATETIME=`date --utc +%Y%m%d-%H%M%S`
CURRENT_BRANCH=`git branch --show`

THIS_TAG="${CURRENT_BRANCH}-${CURRENT_DATETIME}-${CURRENT_VERSION_TAG}"

#Links (Remote)
_GERRIT_URL="ssh://admin@ssh.gerrit.home.arpa:29418"
_DOCKER_URL="https://docker.home.arpa"
_NEXUS_URL="https://nexus.home.arpa/repository/raw-hosted"
_NEXUS_URL_NPM="https://nexus.home.arpa/repository/npm-hosted/"
_DOCKER_TAG="docker.home.arpa"

# Docker image details
RUNNER_BASE_IMAGE="docker.io/library/ubuntu:23.10"
NODE_VERSION=19

# Other
RUNNER_IMAGE="${_DOCKER_TAG}/venthe/ubuntu-runner:23.10"

# VCS upload
GERRIT_URL="localhost:1555"
GERRIT_PROTOCOL="http"
GERRIT_USERNAME="admin"
GERRIT_PASSWORD="secret"

function prepare_npm() {
  npm set strict-ssl=false
  npm adduser --auth-type=legacy --registry "${_NEXUS_URL_NPM}"
}

function clean_projects() {
  npm run clean --workspaces
}

function clean_node_modules() {
  find -type d | grep -E node_modules$ | xargs -I{} rm -rf {} || true
}

function clean_package_locks() {
  find -type d | grep -E node_modules$ | xargs -I{} rm -rf {} || true
}

function clean_stray_js() {
  find -type f | grep -E '\.js$' | grep -vE 'node_modules' | grep src | xargs -I{} rm {} || true
}

function clean_all() {
  clean_node_modules
  clean_stray_js

  npm install

  clean_projects
}

function build_action() {
  npm run build --workspace "actions/${1}"
}

function build_actions() {
  find ./actions -mindepth 1 -maxdepth 1 -type d | sed 's/\.\/actions\///' | xargs -I{} npm run build --workspace "actions/{}"  
}

function build_library() {
  npm run build --workspace "libraries/${1}"
}

function build_runner() {
  npm run build --workspace runner/application
}

function build_container() {
  RUNNER_BASE_IMAGE=${RUNNER_BASE_IMAGE} RUNNER_IMAGE=${RUNNER_IMAGE} npm run build:container --workspace runner/application
}

function publish_container() {
  docker login docker.home.arpa
  docker push "${RUNNER_IMAGE}"
}

function build_libraries() {
  build_library types
  build_library utilities
  build_library process
  build_library core
}

function build_all() {
  build_libraries
  build_actions
  build_runner
  build_container
}

function test() {
  npm run test --workspace ${@}
}

function test_all() {
  npm run test --workspaces
}

function create_gerrit_project() {
  local PROJECT_NAME="${1}"
  local NORMALIZED_PROJECT_NAME=`printf ${PROJECT_NAME} | sed 's/\//%2F/'`

  echo "Creating gerrit project: ${PROJECT_NAME}"
  curl "${GERRIT_PROTOCOL}://${GERRIT_URL}/a/projects/${NORMALIZED_PROJECT_NAME}" \
    -u "${GERRIT_USERNAME}:${GERRIT_PASSWORD}" \
    -X PUT \
    -H "Content-Type: application/json; charset=UTF-8" \
    -d '{}'
}

function delete_gerrit_project() {
  local PROJECT_NAME="${1}"
  local NORMALIZED_PROJECT_NAME=`printf ${PROJECT_NAME} | sed 's/\//%2F/'`

  echo "Deleting gerrit project: ${PROJECT_NAME}"
  curl "${GERRIT_PROTOCOL}://${GERRIT_URL}/a/projects/${NORMALIZED_PROJECT_NAME}" \
    -u "${GERRIT_USERNAME}:${GERRIT_PASSWORD}" \
    -X DELETE || true
}

function upload_project_to_gerrit() {
  local PROJECT_DIRECTORY="${1}"
  local PROJECT_NAME="${2}"
  local ORIGINAL_PWD="${PWD}"
  local WORK_DIR=$(mktemp -d)
  local NORMALIZED_PROJECT_NAME=`printf ${PROJECT_NAME} | sed 's/\//%2F/'`

  cd "${PROJECT_DIRECTORY}"
  cp -r ./ "${WORK_DIR}"
  cd "${WORK_DIR}"

  git init
  git add --all
  git commit -m "Initial commit"
  git remote add origin "${GERRIT_PROTOCOL}://${GERRIT_USERNAME}:${GERRIT_PASSWORD}@${GERRIT_URL}/${NORMALIZED_PROJECT_NAME}"
  git push --force

  cd "${ORIGINAL_PWD}"
  rm -rf "${WORK_DIR}"
}

function upload_project() {
  local PROJECT_DIRECTORY="${1}"
  local PROJECT_NAME="${2}"

  echo "Uploading project ${PROJECT_NAME} as ${NORMALIZED_PROJECT_NAME} from ${PROJECT_DIRECTORY}"

  delete_gerrit_project "${PROJECT_NAME}"
  create_gerrit_project "${PROJECT_NAME}"
  upload_project_to_gerrit "${PROJECT_DIRECTORY}" "${PROJECT_NAME}"
}

function upload_actions() {
  for d in actions/* ; do
    upload_project "${d}" "${d}"
  done
}

function upload_action() {
  upload_project "actions/${1}" "actions/${1}"
}

function test() {
  echo ""
  echo "TESTING ${1}"
  echo ""

  local TEST_PROJECT_NAME="Test/Example-Project-Name"
  local TEST_ROOT="runner/integration-test"
  local TEST_PATH_ENV="${TEST_ROOT}/common/env"
  local TEST_PATH_EVENT="${TEST_ROOT}/common/localhost/event.yaml"
  local TEST_PATH_SECRETS="${TEST_ROOT}/common/secrets"
  local TEST_PATH_TEST="${TEST_ROOT}/resources/${1}"
  local TEST_WORKFLOW_NAME="workflow.yaml"
  local TEST_JOB_ID="TestedJob"

  # ENV
  local PIPELINE_WORKFLOW_EXECUTION_ID="Test-Execution-Id"
  local PIPELINE_JOB_NAME="Test-Job-Name"

  local SECRET_DOCKER_USERNAME=admin
  local SECRET_DOCKER_PASSWORD=secret
  local SECRET_NEXUS_USERNAME=admin
  local SECRET_NEXUS_PASSWORD=secret

  local __DEBUG_JOB_DATA=`TEST_JOB_ID=${TEST_JOB_ID} \
  TEST_WORKFLOW_NAME=${TEST_WORKFLOW_NAME} \
  TEST_PROJECT_NAME=${TEST_PROJECT_NAME} \
  yq ea '
      . as $item ireduce ({}; . * $item ) |
      .projectName = env(TEST_PROJECT_NAME) |
      .ref = "refs/heads/main" |
      .workflow = ._workflow.name // env(TEST_WORKFLOW_NAME) |
      .event = ._event |
      .env = ._workflow.env // {} |
      .env *= ._workflow.jobs[env(TEST_JOB_ID)].env // {} |
      .outputs = {} |
      .steps = ._workflow.jobs[env(TEST_JOB_ID)].steps |
      .timeoutMinutes = 6 |
      .continueOnError = true |
      del ._workflow |
      del ._event
    ' \
    <(yq '{"_event": .}' "${TEST_PATH_EVENT}") \
    <(yq '{"_workflow": .}' "${TEST_PATH_TEST}/.pipeline/workflows/${TEST_WORKFLOW_NAME}") | \
    base64 -w0`

  delete_gerrit_project "${TEST_PROJECT_NAME}"
  create_gerrit_project "${TEST_PROJECT_NAME}"
  upload_project_to_gerrit "${TEST_PATH_TEST}" "${TEST_PROJECT_NAME}"

  docker run \
    --rm --interactive --tty \
    --volume "${PWD}/runner/application/dist/index.js:/runner/index.js" \
    --volume "${PWD}/runner/application/dist/sourcemap-register.js:/runner/sourcemap-register.js" \
    --volume "${PWD}/runner/application/dist/index.js.map:/runner/index.js.map" \
    --volume "/etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro" \
    --volume "${HOME}/.kube/config:/root/.kube/config:ro" \
    --volume "${PWD}/runner/application/test/test.sh:/test.sh" \
    \
    --env PIPELINE_VERSION_CONTROL_TYPE="ssh" \
    --env PIPELINE_VERSION_CONTROL_SSH_PORT="1556" \
    --env PIPELINE_VERSION_CONTROL_SSH_HOST="host.docker.internal" \
    --env PIPELINE_VERSION_CONTROL_SSH_USERNAME="admin" \
    --env __DEBUG_JOB_DATA="${__DEBUG_JOB_DATA}" \
    --env __DEBUG_SSH_PRIVATE_KEY="`cat ~/.ssh/id_rsa | base64 -w0`" \
    --env __DEBUG_DONT_UPDATE_STATUS="true" \
    --env PIPELINE_FILE_STORAGE_TYPE="nexus" \
    --env PIPELINE_FILE_STORAGE_URL="${_NEXUS_URL}" \
    \
    --env SECRET_DOCKER_USERNAME="${SECRET_DOCKER_USERNAME}" \
    --env SECRET_DOCKER_PASSWORD="${SECRET_DOCKER_PASSWORD}" \
    --env SECRET_NEXUS_USERNAME="${SECRET_NEXUS_USERNAME}" \
    --env SECRET_NEXUS_PASSWORD="${SECRET_NEXUS_PASSWORD}" \
    --env PIPELINE_DEBUG="1" \
    \
    --privileged \
    \
    "${RUNNER_IMAGE}" \
    /test.sh
}

function test_all() {
  test "actions/artifact"
  test "actions/cache/cache-key/hash-key"
  test "actions/cache/restore-and-save"
  # test "actions/cache/single-action"
  test "actions/cache/skip-on-cache-hit"
  test "actions/checkout"
  test "actions/python/pip/requirements"
  test "actions/python/pip/with"
  test "actions/setup-docker"
  test "actions/setup-kubectl"
  test "actions/setup-yq"
  test "call-shell"
  test "composite-and-custom"
  test "docker-action"
}

if [[ ${#} -ne 0 ]]; then
  if declare -f "$1" >/dev/null; then
    # call arguments verbatim
    "${@}"
  else
    # Show a helpful error
    echo >&2 "'$1' is not a known function name"
    exit 1
  fi
fi
