/* =============================================
   MEDIUM.JS — Fetch & render Medium RSS feed
   Multi-proxy fallback chain (5 methods)
   Adapted from MurphyFreelance approach
   ============================================= */

// options.since: only show posts published on or after this date (e.g. '2026-01-01').
// Older posts are listed statically on the page, because Medium's feed only keeps the latest 10.
async function loadMediumArticles(username, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !username) return;

    const profileUrl = `https://medium.com/@${username}`;
    const since = options.since ? new Date(options.since) : null;

    showSkeletons(container);

    const rssUrl = `https://medium.com/feed/@${username}`;

    const methods = [
        // Method 1: AllOrigins (returns JSON wrapper)
        async () => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`);
            if (!res.ok) throw new Error(`AllOrigins ${res.status}`);
            const data = await res.json();
            if (!data.contents) throw new Error('No content');
            return parseRSSXML(data.contents);
        },
        // Method 2: RSS2JSON
        async () => {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
            if (!res.ok) throw new Error(`rss2json ${res.status}`);
            const data = await res.json();
            if (data.status !== 'ok' || !data.items?.length) throw new Error('rss2json empty');
            return data.items.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                content: item.content || item.description || '',
                thumbnail: item.thumbnail || item.enclosure?.link || firstImage(item.content || item.description),
            }));
        },
        // Method 3: proxy.cors.sh
        async () => {
            const res = await fetch(`https://proxy.cors.sh/${rssUrl}`);
            if (!res.ok) throw new Error(`cors.sh ${res.status}`);
            return parseRSSXML(await res.text());
        },
        // Method 4: corsproxy.org
        async () => {
            const res = await fetch(`https://corsproxy.org/?${encodeURIComponent(rssUrl)}`);
            if (!res.ok) throw new Error(`corsproxy.org ${res.status}`);
            return parseRSSXML(await res.text());
        },
        // Method 5: codetabs
        async () => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`);
            if (!res.ok) throw new Error(`codetabs ${res.status}`);
            return parseRSSXML(await res.text());
        },
    ];

    for (let i = 0; i < methods.length; i++) {
        try {
            const items = await methods[i]();
            if (items?.length) {
                const recent = since ? items.filter(item => new Date(item.pubDate) >= since) : items;
                if (recent.length) renderArticles(container, recent.slice(0, 6), profileUrl);
                else showEmpty(container, profileUrl);
                return;
            }
        } catch (e) {
            console.warn(`Medium feed method ${i + 1} failed:`, e.message);
        }
    }

    showError(container, profileUrl);
}

function parseRSSXML(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    return Array.from(xml.querySelectorAll('item')).map(item => {
        // content:encoded — try with namespace first
        const contentEl = item.getElementsByTagNameNS(
            'http://purl.org/rss/1.0/modules/content/', 'encoded'
        )[0];
        const content = contentEl?.textContent
            || item.querySelector('description')?.textContent || '';

        // Thumbnail: media:thumbnail → first <img> in content
        const mediaThumb = item.getElementsByTagNameNS(
            'http://search.yahoo.com/mrss/', 'thumbnail'
        )[0];
        const thumbnail = mediaThumb?.getAttribute('url') || firstImage(content);

        // <link> is a text node in RSS 2.0, not an attribute
        const linkEl = item.querySelector('link');
        const link = linkEl?.nextSibling?.nodeValue?.trim()
            || linkEl?.textContent?.trim()
            || item.querySelector('guid')?.textContent?.trim() || '#';

        return {
            title: item.querySelector('title')?.textContent?.trim() || '',
            link,
            pubDate: item.querySelector('pubDate')?.textContent || '',
            content,
            thumbnail,
        };
    });
}

// First real image in a post's HTML, skipping Medium's tracking pixel (medium.com/_/stat)
function firstImage(html) {
    const sources = [...String(html || '').matchAll(/<img[^>]+src="([^">]+)"/g)].map(m => m[1]);
    return sources.find(src => !src.includes('/_/stat')) || '';
}

// Some proxies return titles with entities still encoded (e.g. "&amp;"), so decode before escaping
function decodeEntities(value) {
    return new DOMParser().parseFromString(String(value), 'text/html').documentElement.textContent;
}

// The feed arrives via third-party proxies, so treat everything in it as untrusted text.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
}

// Only allow https links and images hosted on medium.com (incl. its CDN subdomains).
function mediumUrl(value) {
    try {
        const url = new URL(value);
        const onMedium = url.hostname === 'medium.com' || url.hostname.endsWith('.medium.com');
        return url.protocol === 'https:' && onMedium ? url.href : null;
    } catch {
        return null;
    }
}

function renderArticles(container, items, profileUrl) {
    container.innerHTML = items.map(item => {
        const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : '';

        // DOMParser builds an inert document: no scripts run and no images load
        const doc = new DOMParser().parseFromString(item.content, 'text/html');
        const text = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        const excerpt = text.length > 180 ? text.substring(0, 180) + '…' : text;
        const readTime = Math.max(1, Math.round(text.split(/\s+/).length / 200));

        const link = mediumUrl(item.link) || profileUrl;
        const thumbnail = mediumUrl(item.thumbnail);
        const imgHtml = thumbnail
            ? `<img src="${escapeHTML(thumbnail)}" alt="" loading="lazy"
                style="width:100%;height:180px;object-fit:cover;display:block;"
                onerror="this.style.display='none'">`
            : '';

        return `
        <div class="article-card" data-aos="fade-up" style="padding:0;overflow:hidden;">
          ${imgHtml}
          <div style="padding:1.5rem;">
            <div class="article-meta">
              <span class="article-source">✍️ Medium</span>
              <span class="dot"></span>
              <span>${escapeHTML(date)}</span>
              <span class="dot"></span>
              <span>${readTime} min read</span>
            </div>
            <h3 class="article-title" style="margin-top:0.6rem;">${escapeHTML(decodeEntities(item.title))}</h3>
            <p class="article-excerpt">${escapeHTML(excerpt)}</p>
            <a class="article-read-more" href="${escapeHTML(link)}" target="_blank" rel="noopener">
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
          <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px;margin-left:1.5rem;"></div>
          <div class="skeleton" style="height:20px;width:85%;margin-bottom:8px;margin-left:1.5rem;"></div>
          <div class="skeleton" style="height:14px;width:70%;margin-left:1.5rem;margin-bottom:1.5rem;"></div>
        </div>`).join('');
}

function showEmpty(container, profileUrl) {
    container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;grid-column:1/-1;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">✍️</div>
          <h3 style="margin-bottom:0.5rem;">First new article coming soon</h3>
          <p style="margin-bottom:1.5rem;">New posts on Medium will appear here automatically.</p>
          <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-outline">
            Follow on Medium →
          </a>
        </div>`;
}

function showError(container, profileUrl) {
    container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;grid-column:1/-1;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">📝</div>
          <h3 style="margin-bottom:0.5rem;">Couldn't load Medium articles</h3>
          <p style="margin-bottom:1.5rem;">All proxy methods failed. Check back soon or read on Medium directly.</p>
          <a href="${profileUrl}" target="_blank" rel="noopener" class="btn btn-outline">
            Visit Medium →
          </a>
        </div>`;
}
