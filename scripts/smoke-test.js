const app = require("../api/index");

async function run() {
  process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pass";
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || "secret";

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const admin = await fetch(`${base}/admin`);
    const blocked = await fetch(`${base}/api/admin/bookings`);
    const settings = await fetch(`${base}/api/settings`);
    const galleryPage = await fetch(`${base}/gallery.html`);
    const booking = await fetch(`${base}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Guest", phone: "1234567890", date: "2026-06-20", time: "19:00", guests: "2" })
    });
    const login = await fetch(`${base}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })
    });
    const cookie = login.headers.get("set-cookie");
    const bookings = await fetch(`${base}/api/admin/bookings`, { headers: { cookie } });
    console.log(JSON.stringify({
      admin: admin.status,
      protectedBeforeLogin: blocked.status,
      settings: settings.status,
      galleryPage: galleryPage.status,
      booking: booking.status,
      login: login.status,
      protectedAfterLogin: bookings.status
    }, null, 2));
    if (admin.status !== 200 || blocked.status !== 401 || settings.status !== 200 || galleryPage.status !== 200 || booking.status !== 201 || login.status !== 200 || bookings.status !== 200) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
