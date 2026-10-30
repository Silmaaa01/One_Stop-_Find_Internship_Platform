# One Stop Find Internship (frontend demo)

HTML5 + CSS3 + vanilla JavaScript only. No backend, database or API.

## Run
Open `index.html` in a browser (double-click), or in VS Code use the Live Server extension.
Internet is only needed for Google Fonts; the site still works without it.

## Demo logins (login page has one-click buttons)
- Student: student@demo.test
- Recruiter: recruiter@demo.test
- Admin: admin@demo.test
Any password of 6+ characters works. This is SIMULATED: nothing is authenticated by a server.

## Structure
- `css/` styles.css (tokens, base), components.css (nav, cards, pages), responsive.css
- `js/data.js` seed data, `storage.js` localStorage + `Db` data layer, `app.js` shared UI
- `js/internships.js` landing/listing/details/saved, `auth.js` login/register,
  `applications.js` student pages, `messaging.js` chat + notifications, `recruiter.js` recruiter + admin
- One HTML shell per page; each runs `Pages[data-page]`.

## Reset
Footer link "Reset demo data", or clear site data in DevTools. To change seed data, edit `js/data.js` and bump `DATA.VERSION`.

## What is simulated
Login, roles (UI-only checks, not security), messages (never sent anywhere), notifications, resume upload (only file name/size stored), company verification, all statistics.
