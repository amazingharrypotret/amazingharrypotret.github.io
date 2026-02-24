/* =============================================
   MEDIUM.JS — Fetch & render Medium RSS feed
   ============================================= */

/**
 * Fetches articles from a Medium RSS feed and renders them.
 * Medium provides RSS at: https://medium.com/feed/@yourusername
 * We use rss2json.com as a CORS proxy (free, no key needed).
 *
 * CONFIG: Set MEDIUM_USERNAME at top of articles.html
 */

async function loadMediumArticles(username, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !username) return;

    // Show skeletons while loading
    container.innerHTML = Array(3).fill(`
    <div class="article-card">
      <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px;"></div>
      <div class="skeleton" style="height:20px;width:85%;margin-bottom:8px;"></div>
      <div class="skeleton" style="height:14px;width:100%;margin-bottom:6px;"></div>
      <div class="skeleton" style="height:14px;width:70%;"></div>
    </div>
  `).join('');

    try {
        const rssUrl = `https://medium.com/feed/@${username}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();

        if (data.status !== 'ok' || !data.items?.length) {
            throw new Error('No articles found');
        }

        container.innerHTML = data.items.slice(0, 6).map(item => {
            const date = new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            // Strip HTML from description for excerpt
            const tmp = document.createElement('div');
            tmp.innerHTML = item.description;
            const excerpt = tmp.textContent.substring(0, 160) + '…';

            // Estimate read time
            const wordCount = tmp.textContent.split(/\s+/).length;
            const readTime = Math.max(1, Math.round(wordCount / 200));

            return `
        <div class="article-card" data-aos="fade-up">
          <div class="article-meta">
            <span class="article-source">✍️ Medium</span>
            <span class="dot"></span>
            <span>${date}</span>
            <span class="dot"></span>
            <span>${readTime} min read</span>
          </div>
          <h3 class="article-title">${item.title}</h3>
          <p class="article-excerpt">${excerpt}</p>
          <a class="article-read-more" href="${item.link}" target="_blank" rel="noopener">
            Read on Medium →
          </a>
        </div>
      `;
        }).join('');

    } catch (err) {
        container.innerHTML = `
      <div class="card" style="text-align:center;padding:3rem;grid-column:1/-1;">
        <div style="font-size:2.5rem;margin-bottom:1rem;">📝</div>
        <h3 style="margin-bottom:0.5rem;">No articles yet</h3>
        <p style="margin-bottom:1.5rem;">Set your Medium username in the config to auto-import posts, or write articles directly below.</p>
        <a href="https://medium.com" target="_blank" class="btn btn-outline">Start writing on Medium →</a>
      </div>`;
    }
}
