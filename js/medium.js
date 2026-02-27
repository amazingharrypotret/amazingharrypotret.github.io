/* =============================================
   MEDIUM.JS — Fetch & render Medium RSS feed
   Multi-proxy fallback chain (5 methods)
   Adapted from MurphyFreelance approach
   ============================================= */

async function loadMediumArticles(username, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !username) return;

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
                thumbnail: item.thumbnail || item.enclosure?.link || '',
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
                renderArticles(container, items.slice(0, 6));
                return;
            }
        } catch (e) {
            console.warn(`Medium feed method ${i + 1} failed:`, e.message);
        }
    }

    showError(container);
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
        let thumbnail = mediaThumb?.getAttribute('url') || '';
        if (!thumbnail) {
            const match = content.match(/<img[^>]+src="([^">]+)"/);
            thumbnail = match?.[1] || '';
        }

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

function renderArticles(container, items) {
    container.innerHTML = items.map(item => {
        const date = item.pubDate
            ? new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            })
            : '';

        const tmp = document.createElement('div');
        tmp.innerHTML = item.content;
        const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
        const excerpt = text.substring(0, 180) + '…';
        const readTime = Math.max(1, Math.round(text.split(/\s+/).length / 200));

        const imgHtml = item.thumbnail
            ? `<img src="${item.thumbnail}" alt="" loading="lazy"
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
          <div class="skeleton" style="height:12px;width:40%;margin-bottom:12px;margin-left:1.5rem;"></div>
          <div class="skeleton" style="height:20px;width:85%;margin-bottom:8px;margin-left:1.5rem;"></div>
          <div class="skeleton" style="height:14px;width:70%;margin-left:1.5rem;margin-bottom:1.5rem;"></div>
        </div>`).join('');
}

function showError(container) {
    container.innerHTML = `
        <div class="card" style="text-align:center;padding:3rem;grid-column:1/-1;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">📝</div>
          <h3 style="margin-bottom:0.5rem;">Couldn't load Medium articles</h3>
          <p style="margin-bottom:1.5rem;">All proxy methods failed. Check back soon or read on Medium directly.</p>
          <a href="https://medium.com/@hariyanto.tan95" target="_blank" class="btn btn-outline">
            Visit Medium →
          </a>
        </div>`;
}
