const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const files = fs.readdirSync(rootDir).filter(file => file.endsWith(".html") && file !== "admin.html");

const firebaseTags = `  <!-- Firebase Compat SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="js/env.js"></script>
  <script src="js/firebase-db.js"></script>`;

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, "utf8");

  // Check if this HTML page uses settings.js, bookings.js, or gallery.js
  const usesSettings = content.includes("js/settings.js");
  const usesBookings = content.includes("js/bookings.js");
  const usesGallery = content.includes("js/gallery.js");

  if (usesSettings || usesBookings || usesGallery) {
    if (content.includes("js/firebase-db.js")) {
      console.log(`${file}: already has firebase-db.js. Skipping.`);
      return;
    }

    // Find the first occurrence of settings.js, bookings.js, gallery.js or custom.js to insert before it
    const targets = [
      '<script src="js/settings.js"></script>',
      '<script src="js/bookings.js"></script>',
      '<script src="js/gallery.js"></script>',
      '<script src="js/custom.js"></script>',
      '<script src="js/custom.js" type="text/javascript"></script>'
    ];

    let inserted = false;
    for (const target of targets) {
      if (content.includes(target)) {
        content = content.replace(target, `${firebaseTags}\n  ${target}`);
        inserted = true;
        break;
      }
    }

    if (inserted) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`${file}: successfully injected Firebase and env scripts.`);
    } else {
      console.warn(`${file}: script tags found but could not find a suitable injection target.`);
    }
  }
});
