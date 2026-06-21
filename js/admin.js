const loginPanel = document.getElementById("loginPanel");
const dashboardPanel = document.getElementById("dashboardPanel");
const fields = {
  settings: [
    ["restaurantName", "Hotel/Restaurant Name"], ["facebookLink", "Facebook Link"],
    ["instagramLink", "Instagram Link"], ["twitterLink", "Twitter/X Link"],
    ["googleMapsEmbed", "Google Maps iframe or src"], ["openingTime", "Opening Time"],
    ["closingTime", "Closing Time"]
  ],
  images: [
    ["heroImage1", "Hero image 1"], ["heroImage1Secondary", "Hero image 1 corner/secondary image"],
    ["heroImage2", "Hero image 2"], ["heroImage2Secondary", "Hero image 2 corner/secondary image"],
    ["aboutImage1", "About image 1"], ["aboutImage2", "About image 2"],
    ["bookingImage", "Booking/reservation side image"], ["menuHeaderImage", "Menu page header image"],
    ["galleryHeaderImage", "Gallery/images page header image"], ["contactHeaderImage", "Contact page header image"]
  ]
};

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error((await response.json()).error || "Request failed");
  return response.json();
}

function showDashboard(show) {
  loginPanel.hidden = show;
  dashboardPanel.hidden = !show;
}

function renderForm(form, entries, values, endpoint) {
  form.innerHTML = entries.map(([name, label]) => `
    <label>${label}<input name="${name}" value="${values[name] || ""}"></label>
  `).join("") + `<button type="submit">Save changes</button><p class="form-message"></p>`;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    await api(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    form.querySelector(".form-message").textContent = "Saved.";
  };
}

async function loadSettings() {
  const data = await api("/api/settings");
  renderForm(document.getElementById("settingsForm"), fields.settings, data.settings, "/api/admin/settings");
  renderForm(document.getElementById("imagesForm"), fields.images, data.images, "/api/admin/home-images");
}

async function loadBookings() {
  const { bookings } = await api("/api/admin/bookings");
  document.getElementById("bookingsList").innerHTML = bookings.length ? bookings.map((booking) => `
    <article class="booking-row">
      <div><h3>${booking.name} · ${booking.guests} guests</h3><p>${booking.date} at ${booking.time} · ${booking.phone} ${booking.email ? "· " + booking.email : ""}</p><p>${booking.message || ""}</p></div>
      <time>${new Date(booking.createdAt).toLocaleString()}</time>
    </article>
  `).join("") : "<p class='muted'>No bookings yet.</p>";
}

async function loadGallery() {
  const { gallery } = await api("/api/gallery");
  document.getElementById("galleryList").innerHTML = gallery.length ? gallery.map((item) => `
    <article class="image-row">
      <div><h3>${item.title}</h3><p>${item.type === "item" ? "Individual item image" : "Full menu image"}</p></div>
      <div><img src="${item.imageUrl}" alt=""><button class="ghost-button" data-delete="${item.id}">Delete</button></div>
    </article>
  `).join("") : "<p class='muted'>No gallery images uploaded yet.</p>";
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.target).entries())) });
    showDashboard(true);
    await Promise.all([loadSettings(), loadBookings(), loadGallery()]);
  } catch (error) {
    document.getElementById("loginMessage").textContent = error.message;
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  showDashboard(false);
});
document.getElementById("refreshBookings").addEventListener("click", loadBookings);
document.getElementById("galleryList").addEventListener("click", async (event) => {
  if (!event.target.dataset.delete) return;
  await api(`/api/admin/gallery/${event.target.dataset.delete}`, { method: "DELETE" });
  loadGallery();
});
document.getElementById("galleryForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("galleryMessage");
  try {
    await api("/api/admin/gallery", { method: "POST", body: new FormData(event.target) });
    event.target.reset();
    message.textContent = "Image saved.";
    loadGallery();
  } catch (error) {
    message.textContent = error.message;
  }
});

api("/api/admin/me").then(async ({ authenticated }) => {
  showDashboard(authenticated);
  if (authenticated) await Promise.all([loadSettings(), loadBookings(), loadGallery()]);
});
