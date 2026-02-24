# Harry's Personal Website 🚀

A modern, beautiful personal portfolio hosted on **GitHub Pages** — built with vanilla HTML, CSS, and JavaScript. No build tools required.

**Live at:** `https://yourusername.github.io` (after setup)

---

## 🛠️ How to Deploy to GitHub Pages

### Step 1 — Create your GitHub repository

> **Important:** The repo name must be `yourusername.github.io` (replace `yourusername` with your actual GitHub username).

1. Go to [github.com/new](https://github.com/new)
2. Repository name: **`yourusername.github.io`** (e.g. `harry.github.io`)
3. Set to **Public**
4. Do **not** initialise with README (you already have one)
5. Click **Create repository**

### Step 2 — Push this code to GitHub

```bash
cd /Users/harry/.gemini/antigravity/scratch/personal-website

git init
git add .
git commit -m "🚀 Initial commit — personal website"
git branch -M main
git remote add origin https://github.com/yourusername/yourusername.github.io.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. That's it! The workflow will deploy automatically ✅

### Step 4 — Visit your site

After the Action completes (~1 min), your site is live at:
```
https://yourusername.github.io
```

---

## ✏️ How to Customise

### 1. Update your personal info
Edit `index.html` — search for placeholder text like:
- `"Harry"` → replace with your name
- `"your@email.com"` → your real email
- `"yourusername"` → your GitHub/social usernames
- The hero description and bio paragraphs
- The timeline (experience & education) items

### 2. Add your projects
Edit `projects.html` — find the `items` array and add your real projects/publications:
```js
{
  type: 'project',         // or 'publication'
  icon: '🔬',
  title: 'My Project Name',
  desc: 'Description of what it does...',
  tags: ['Python', 'TensorFlow'],
  links: [
    { label: '⭐ GitHub', url: 'https://github.com/you/repo' },
    { label: '🔗 Live', url: 'https://yoursite.com' }
  ]
}
```

### 3. Connect your Medium account
Edit `articles.html` — change this one line:
```js
const MEDIUM_USERNAME = 'yourusername'; // ← Your Medium @username
```
Your latest Medium articles will auto-appear!

### 4. Update social links
Search for `yourusername` across all files and replace with your real handles.

### 5. Add a profile photo
Replace the `<img>` in `index.html` hero section:
```html
<img class="hero-avatar-img" src="assets/your-photo.jpg" alt="Your Name" />
```
Drop your photo into the `assets/` folder.

### 6. Add a real CV
Replace `assets/cv.pdf` with your actual CV file.

### 7. Add Instagram photos
In `hobbies.html`, replace the placeholder `photos` array with actual photo paths:
```js
{ src: 'assets/photo1.jpg', caption: 'Caption here' }
```

---

## 🌐 Custom Domain (Optional)

Want `www.yourname.com` instead of `yourname.github.io`?

1. Buy a domain (e.g. from Namecheap, Google Domains)
2. In your DNS settings, add a CNAME record: `www` → `yourusername.github.io`
3. In GitHub → Settings → Pages → Custom domain: enter your domain
4. Enable **Enforce HTTPS** ✅

---

## 📁 File Structure

```
personal-website/
├── index.html          Homepage
├── projects.html       Projects & Publications
├── articles.html       Articles (Medium + own)
├── hobbies.html        Hobbies & social life
├── css/
│   ├── base.css        Design tokens, reset, typography
│   ├── components.css  Nav, cards, timeline, footer
│   └── animations.css  Scroll animations, transitions
├── js/
│   ├── nav.js          Navigation + typewriter effect
│   └── medium.js       Medium RSS article fetcher
├── assets/
│   └── cv.pdf          Your CV (replace with real file)
└── .github/
    └── workflows/
        └── deploy.yml  GitHub Actions auto-deploy
```

---

## 📄 License

Feel free to use this as a template for your own site!
