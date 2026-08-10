# Dutta Travels Website

A simple website for Dutta Travels (Habra, West Bengal) — a 55-seater non-AC bus rental service. No server or database is needed; three quick setups make it fully functional. Do these in order.

## 1. Set up the availability calendar (Google Sheets)

The `availability.html` page reads booked dates live from a Google Sheet, so you can block dates from your phone or PC and the site updates automatically — no re-uploading needed.

1. Create a new Google Sheet.
2. In row 1, add these exact column headers: `From Date`, `To Date`, `Note`.
3. Add one row per booking, e.g.:

   | From Date  | To Date    | Note            |
   |------------|------------|-----------------|
   | 2026-09-05 | 2026-09-08 | Darjeeling trip |
   | 2026-10-12 | 2026-10-12 | Wedding, Habra  |

   Use the `YYYY-MM-DD` format (e.g. `2026-09-05`) for reliability. A single-day booking can repeat the same date in both columns.
4. Go to **File → Share → Publish to web**.
5. Under "Link", choose the specific sheet/tab, and set the format to **CSV**. Click **Publish**.
6. Copy the generated link (it will look like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`).
7. Open `js/config.js` in a text editor and replace:
   ```js
   BOOKINGS_CSV_URL: "PASTE_YOUR_GOOGLE_SHEET_CSV_LINK_HERE",
   ```
   with your copied link.

**Important:** "Publish to web" only creates a read-only public CSV snapshot — visitors to your site can see the booked dates and notes, but cannot edit your sheet. Don't put anything sensitive in the `Note` column. Only you (signed into the Google account that owns the sheet) can edit it.

To block a new date going forward, just add a row to the sheet — the website picks it up automatically within moments.

## 2. Set up the enquiry/contact forms (Formspree)

The enquiry and contact forms need somewhere to deliver submissions. This site uses [Formspree](https://formspree.io), a free service that emails you form submissions — no backend required.

1. Go to https://formspree.io and sign up for a free account using `DTBusiness@gmail.com`.
2. Create a new form and copy its endpoint URL (looks like `https://formspree.io/f/abcdwxyz`).
3. Open `js/config.js` and replace:
   ```js
   FORMSPREE_ENDPOINT: "PASTE_YOUR_FORMSPREE_ENDPOINT_HERE",
   ```
   with your endpoint.
4. Submit a test enquiry from `enquiry.html` on the live site to confirm you receive the email.

Until this is set up, submitting either form will show a message asking the customer to use WhatsApp instead — so the site never appears broken.

## 3. Add your real phone number

Open `js/config.js` and replace the placeholder number with your real WhatsApp/phone number (digits only, with country code, no `+` or spaces):

```js
WHATSAPP_NUMBER: "91XXXXXX8884",   // replace XXXXXX with your real number
PHONE_DISPLAY: "+91 XXXXXX8884",   // how the number is shown on the site
```

This single change updates every WhatsApp button, `tel:` link, and displayed phone number across all pages.

## 4. Add real photos (optional but recommended)

`about.html` currently has dashed placeholder boxes marked `[ Photo of Dutta Travels bus ]`. Replace these `<div class="img-placeholder">...</div>` blocks with `<img src="images/your-photo.jpg" alt="...">` once you have real photos of the bus (exterior, interior/seating, TV/charging points). Create an `images/` folder in the site and place your photos there.

## 5. Deploy the site

The site is plain HTML/CSS/JS — no build step. Easiest free options:

- **Netlify (drag-and-drop):** Go to https://app.netlify.com/drop and drag the whole project folder in. You'll get a live URL instantly, and can add a custom domain later.
- **GitHub Pages:** Push this folder to a GitHub repository and enable Pages in the repo settings (Settings → Pages → deploy from the main branch).

## File overview

| File / Folder        | Purpose                                              |
|-----------------------|-------------------------------------------------------|
| `index.html`          | Home page                                             |
| `about.html`          | About Dutta Travels + bus details                     |
| `routes.html`         | Routes served, North India specialty                  |
| `availability.html`   | Live calendar from your Google Sheet                  |
| `enquiry.html`        | Enquiry/booking form                                   |
| `contact.html`        | Contact details, map, contact form                     |
| `css/style.css`       | All site styling                                       |
| `js/config.js`        | **Edit this file** — Google Sheet URL, Formspree endpoint, phone number |
| `js/main.js`          | Site behaviour — nav, forms, calendar rendering        |

Everything you need to configure lives in `js/config.js` — you shouldn't need to touch any other file for day-to-day updates.
