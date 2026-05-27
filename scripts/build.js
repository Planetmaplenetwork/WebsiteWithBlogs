const { Octokit } = require("@octokit/rest");
const markdownIt = require("markdown-it");
const { markdownToTxt } = require("markdown-to-txt");
const fs = require("fs");
const path = require("path");

// ─── CONFIGURATION – change these three values ──────────────
const OWNER = "A53o";          // your GitHub username
const REPO = "BlogPostTest";                        // this repository name
const YOUR_USERNAME = "A53o";  // the only allowed issue author
// ──────────────────────────────────────────────────────────────

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN environment variable.");
  process.exit(1);
}

const octokit = new Octokit({ auth: TOKEN });
const md = new markdownIt({ html: true });

// Helper: escape HTML to prevent XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper: create a safe filename (slug) from a title
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 60);
}

async function generatePosts() {
  console.log("Fetching issues…");

  const { data: issues } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    state: "open",
    per_page: 100,
  });

  // Security: only keep issues created by YOU (ignore pull requests)
  const myPosts = issues.filter(
    (issue) =>
      issue.user.login === YOUR_USERNAME && !issue.pull_request
  );

  console.log(`Found ${myPosts.length} post(s) from you.`);

  // Prepare output directory for individual posts
  const outDir = path.join(__dirname, "..", "posts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Load the individual post template
  const postTemplate = fs.readFileSync(
    path.join(__dirname, "..", "template.html"),
    "utf8"
  );

  // --- Step 1: Generate each post page ---
  for (const issue of myPosts) {
    const contentHtml = md.render(issue.body || "");
    const pageHtml = postTemplate
      .replace(/{{TITLE}}/g, escapeHtml(issue.title))
      .replace(/{{DATE}}/g, issue.created_at.split("T")[0])
      .replace(/{{CONTENT}}/g, contentHtml);

    const slug = slugify(issue.title) || `post-${issue.number}`;
    const filePath = path.join(outDir, `${slug}.html`);
    fs.writeFileSync(filePath, pageHtml);
    console.log(`✔ Created posts/${slug}.html`);
  }

  // --- Step 2: Build the homepage with excerpt cards ---
  // Sort by creation date, newest first
  myPosts.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const recentPosts = myPosts.slice(0, 3);

  let postListHtml = "";
  if (recentPosts.length === 0) {
    postListHtml = "<p>No posts yet. Check back soon!</p>";
  } else {
    postListHtml = '<div class="post-grid">';
    for (const post of recentPosts) {
      const slug = slugify(post.title) || `post-${post.number}`;
      const date = post.created_at.split("T")[0];
      const rawMarkdown = post.body || "";

      // Generate a plain‑text excerpt (first 160 characters)
      let excerpt = markdownToTxt(rawMarkdown).substring(0, 160);
      if (markdownToTxt(rawMarkdown).length > 160) excerpt += "…";

      postListHtml += `
        <article class="post-card">
          <h2><a href="posts/${slug}.html">${escapeHtml(post.title)}</a></h2>
          <time datetime="${date}">${date}</time>
          <p class="excerpt">${escapeHtml(excerpt)}</p>
          <a href="posts/${slug}.html" class="read-more">Read more →</a>
        </article>`;
    }
    postListHtml += "</div>";
  }

  // Load the homepage template and insert the list
  const homeTemplate = fs.readFileSync(
    path.join(__dirname, "..", "home.html"),
    "utf8"
  );
  const homePageHtml = homeTemplate.replace(/{{POST_LIST}}/g, postListHtml);

  // Write it as index.html (the actual homepage)
  fs.writeFileSync(
    path.join(__dirname, "..", "index.html"),
    homePageHtml
  );
  console.log("✔ Generated index.html with recent posts");
}

generatePosts().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});