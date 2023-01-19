const { Octokit } = require("octokit");
const githubAPI = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

exports.getRepoContributorsActivity = ({ owner, repo }) => {
  return githubAPI.request("GET /repos/{owner}/{repo}/stats/contributors", {
    owner,
    repo,
  });
};

exports.getRepoActivity = ({ owner, repo }) => {
  return githubAPI.request("GET /repos/{owner}/{repo}/stats/commit_activity", {
    owner,
    repo,
  });
};

exports.getRepoInfo = ({ owner, repo }) => {
  return githubAPI.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
  });
};

exports.searchGithubRepos = ({ searchKey, per_page = 30, page = 1 }) => {
  return githubAPI.request("GET /search/code", {
    q: searchKey,
    per_page,
    page,
  });
};

exports.getRepoContributors = ({ owner, repo, per_page = 30, page = 1 }) => {
  return githubAPI.request("GET /repos/{owner}/{repo}/contributors", {
    owner,
    repo,
    per_page,
    page,
  });
};

exports.getGitUserInfo = ({ username }) => {
  return githubAPI.request("GET /users/{username}", {
    username,
  });
};

exports.getGetRepoCommits = ({ owner, repo, ...props }) => {
  return githubAPI.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    ...props,
  });
};
