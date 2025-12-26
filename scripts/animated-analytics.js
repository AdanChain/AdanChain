import fs from "fs";
import fetch from "node-fetch";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Error: GITHUB_TOKEN environment variable is not set");
  process.exit(1);
}

const headers = { Authorization: `token ${token}` };

const res = await fetch("https://api.github.com/user/repos?per_page=100", {
  headers
});

if (!res.ok) {
  const error = await res.json().catch(() => ({ message: res.statusText }));
  console.error(`Error fetching repos: ${res.status} ${res.statusText}`);
  console.error(error);
  process.exit(1);
}

const repos = await res.json();

if (!Array.isArray(repos)) {
  console.error("Error: Expected array of repos, got:", typeof repos);
  console.error(repos);
  process.exit(1);
}

// Count languages
const langs = {};
for (const repo of repos) {
  if (!repo.language) continue;
  langs[repo.language] = (langs[repo.language] || 0) + 1;
}

// Sort by usage
const sorted = Object.entries(langs)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6);

const barMax = Math.max(...sorted.map(l => l[1]));

const bars = sorted.map(([lang, count], i) => {
  const width = (count / barMax) * 300;
  const y = 40 + i * 30;

  return `
    <text x="10" y="${y + 15}" fill="#c9d1d9">${lang}</text>
    <rect x="100" y="${y}" width="0" height="16" fill="#58a6ff">
      <animate attributeName="width"
        from="0" to="${width}"
        dur="1s"
        begin="${i * 0.15}s"
        fill="freeze"/>
    </rect>
    <text x="${110 + width}" y="${y + 14}" fill="#c9d1d9" font-size="12">
      ${count}
    </text>
  `;
}).join("");

const svg = `
<svg width="460" height="240" viewBox="0 0 460 240"
  xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: monospace; font-size: 14px; }
  </style>

  <text x="10" y="20" fill="#58a6ff">Most Used Languages</text>

  ${bars}
</svg>
`;

fs.mkdirSync("analytics", { recursive: true });
fs.writeFileSync("analytics/languages-animated.svg", svg);