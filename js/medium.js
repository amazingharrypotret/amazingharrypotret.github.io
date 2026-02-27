/* =============================================
   MEDIUM.JS — Fetch & render Medium RSS feed
   Strategy: try corsproxy.io (direct XML parse),
   fallback to rss2json.com
   ============================================= */

async function loadMediumArticles(username, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !username) return;

    showSkeletons(container);

    const rssUrl = `https://medium.com/feed/@${username}`;

    // Try primary: corsproxy.io → parse XML directly
    try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(rssUrl)}`);
        if (!res.ok) throw new Error('corsproxy failed');
        const text = await res.text();
        const items = parseRSS(text);
        if (!items.length) throw new Error('empty feed');
        renderArticles(container, items);
        return;
    } catch (e) {
        console.warn('Medium feed: corsproxy failed, trying rss2json…', e);
    }

    // Fallback: rss2json.com
    try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        if (!res.ok) throw new Error('rss2json failed');
        const data = await res.json();
        if (!data.items?.length) throw new Error('no items');
        const items = data.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            content: item.description || item.content || '',
        }));
        renderArticles(container, items);
        return;
    } catch (e) {
        console.warn('Medium feed: rss2json also failed', e);
    }

    showError(container);
}

function parseRSS(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    return Array.from(xml.querySelectorAll('item')).map(item => {
        // content:encoded is the full post HTML
        const contentEl = item.getElementsByTagNameNS(
            'http://purl.org/rss/1.0/modules/content/', 'encoded'
        )[0];
        return {
            title: item.querySelector('title')?.textContent?.trim() || '',
            link: item.querySelector('link')?.nextSibling?.textContent?.trim()
                || item.querySelector('guid')?.textContent?.trim() || '#',
            pubDate: item.querySelector('pubDate')?.textContent || '',
            content: contentEl?.textContent || item.querySelector('description')?.textContent || '',
        };
    });
}

function renderArticles(container, items) {
    container.innerHTML = items.slice(0, 6).map(item => {
        const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
        const tmp = document.createElement('div');
        tmp.innerHTML = item.content;
        const text = tmp.textContent || '';
        const excerpt = text.replace(/\s+/g, ' ').trim().substring(0, 180) + '…';
        const readTime = Math.max(1, Math.round(text.split(/\s+/).length / 200));

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
        </div>`;
    }).join('');
}

function showSkeletons(container) {
    container.innerHTML = Array(3).fill(`
        <div class="article-card">
          <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px;"></div>
          <div class="skeleton" style="height:20px;width:85%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:14px;width:100%;margin-bottom:6px;"></div>
          <div class="skeleton" style="height:14px;width:70%;"></div>
        </div>`).join('');
}

function showError(container) {
    container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;grid-column:1/-1;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">📝</div>
          <h3 style="margin-bottom:0.5rem;">Couldn't load Medium articles</h3>
          <p style="margin-bottom:1.5rem;">Check back soon, or read directly on Medium.</p>
          <a href="https://medium.com/@hariyanto.tan95" target="_blank" class="btn btn-outline">
            Visit Medium →
          </a>
        </div>`;
}
