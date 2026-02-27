/* =============================================
   MEDIUM.JS — Fetch & render Medium RSS feed
   Proxy: allorigins.win (confirmed working with Medium)
   Features: title, date, read time, thumbnail image
   ============================================= */

async function loadMediumArticles(username, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !username) return;

    showSkeletons(container);

    const rssUrl = `https://medium.com/feed/@${username}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        if (!json.contents) throw new Error('Empty response');
        const items = parseRSS(json.contents);
        if (!items.length) throw new Error('No articles found');
        renderArticles(container, items);
    } catch (err) {
        console.error('Medium feed error:', err);
        showError(container);
    }
}

function parseRSS(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');

    return Array.from(xml.querySelectorAll('item')).map(item => {
        // content:encoded holds the full HTML post
        const contentEl = item.getElementsByTagNameNS(
            'http://purl.org/rss/1.0/modules/content/', 'encoded'
        )[0];

        // Thumbnail: try media:thumbnail first, then first <img> in content
        const mediaThumb = item.getElementsByTagNameNS(
            'http://search.yahoo.com/mrss/', 'thumbnail'
        )[0];
        let thumbnail = mediaThumb?.getAttribute('url') || '';
        if (!thumbnail && contentEl) {
            const tmp = document.createElement('div');
            tmp.innerHTML = contentEl.textContent;
            thumbnail = tmp.querySelector('img')?.src || '';
        }

        // <link> in RSS 2.0 is a text node, not an attribute
        const linkEl = item.querySelector('link');
        const link = linkEl
            ? (linkEl.nextSibling?.nodeValue?.trim() || linkEl.textContent?.trim())
            : item.querySelector('guid')?.textContent?.trim() || '#';

        return {
            title: item.querySelector('title')?.textContent?.trim() || '',
            link,
            pubDate: item.querySelector('pubDate')?.textContent || '',
            content: contentEl?.textContent || item.querySelector('description')?.textContent || '',
            thumbnail,
        };
    });
}

function renderArticles(container, items) {
    container.innerHTML = items.slice(0, 6).map(item => {
        const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : '';
        const tmp = document.createElement('div');
        tmp.innerHTML = item.content;
        const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
        const excerpt = text.substring(0, 160) + '…';
        const readTime = Math.max(1, Math.round(text.split(/\s+/).length / 200));

        const imgHtml = item.thumbnail
            ? `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy"
                style="width:100%;height:180px;object-fit:cover;margin-bottom:1.25rem;display:block;">`
            : '';

        return `
        <div class="article-card" data-aos="fade-up" style="padding:0;overflow:hidden;">
          ${imgHtml}
          <div style="padding:1.5rem;">
            <div class="article-meta">
              <span class="article-source">✍️ Medium</span>
              <span class="dot"></span>
              <span>${date}</span>
              <span class="dot"></span>
              <span>${readTime} min read</span>
            </div>
            <h3 class="article-title" style="margin-top:0.6rem;">${item.title}</h3>
            <p class="article-excerpt">${excerpt}</p>
            <a class="article-read-more" href="${item.link}" target="_blank" rel="noopener">
              Read on Medium →
            </a>
          </div>
        </div>`;
    }).join('');
}

function showSkeletons(container) {
    container.innerHTML = Array(3).fill(`
        <div class="article-card">
          <div class="skeleton" style="height:180px;width:100%;margin-bottom:12px;"></div>
          <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px;"></div>
          <div class="skeleton" style="height:20px;width:85%;margin-bottom:8px;"></div>
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
