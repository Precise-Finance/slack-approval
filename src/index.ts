import * as core from "@actions/core";
import { MrkdwnElement, PlainTextElement, WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN || "";
const channel_id = process.env.SLACK_CHANNEL_ID || "";
const env = process.env.DEPLOYMENT_ENV || "";

async function run(): Promise<void> {
  try {
    const web = new WebClient(token);

    const github_server_url = process.env.GITHUB_SERVER_URL || "";
    const github_repos = process.env.GITHUB_REPOSITORY || "";
    const run_id = process.env.GITHUB_RUN_ID || "";
    const actionsUrl = `${github_server_url}/${github_repos}/actions/runs/${run_id}`;
    const workflow = process.env.GITHUB_WORKFLOW || "";
    const runnerOS = process.env.RUNNER_OS || "";
    const actor = process.env.GITHUB_ACTOR || "";
    const branch = process.env.GITHUB_REF || "";
    const pr_link = process.env.PR_LINK || undefined;
    const commit_message = process.env.COMMIT_MESSAGE || undefined;

    const sha = process.env.COMMIT_SHA || "";
    const customId = JSON.stringify({
      repo: github_repos,
      run_id: run_id,
      env: env,
      sha: sha,
    });

    let fields: (PlainTextElement | MrkdwnElement)[] = [
      { type: "mrkdwn", text: `*GitHub Actor:*\n${actor}` },
      { type: "mrkdwn", text: `*Branch:* ${branch}` },
      { type: "mrkdwn", text: `*Env:* ${env}` },
    ];

    // Add PR details only if they exist:
    if (pr_link) {
      fields.push({ type: "mrkdwn", text: `*Pull Request:*\n${pr_link}` });
    }
    if (commit_message) {
      fields.push({
        type: "mrkdwn",
        text: `*COMMIT_MESSAGE:*\n${commit_message}`,
      });
    }

    fields.push(
      { type: "mrkdwn", text: `*Actions URL:*\n${actionsUrl}` },
      { type: "mrkdwn", text: `*GITHUB_RUN_ID:*\n${run_id}` },
      {
        type: "mrkdwn",
        text: `*Repos:*\n${github_server_url}/${github_repos}`,
      },
      { type: "mrkdwn", text: `*Workflow:*\n${workflow}` },
      { type: "mrkdwn", text: `*RunnerOS:*\n${runnerOS}` }
    );

    await web.chat.postMessage({
      channel: channel_id,
      text: `GitHub Actions Approval Request\n*${github_repos}*\n${branch}, ${env}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `GitHub Actions Approval Request ${github_repos}, ${branch}, ${env}`,
          },
        },
        {
          type: "section",
          fields: fields,
        },
        {
          type: "actions",
          block_id: customId,
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Approve",
              },
              style: "primary",
              value: "approve",
              action_id: "slack-approval-approve",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Reject",
              },
              style: "danger",
              value: "reject",
              action_id: "slack-approval-reject",
            },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
