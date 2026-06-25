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
    const messageEl = form.querySelector(".form-message");
    messageEl.textContent = "Saving...";
    try {
      if (window.dbApi) {
        if (endpoint === "/api/admin/settings") {
          await window.dbApi.dbUpdateSettings(body);
        } else {
          await window.dbApi.dbUpdateImages(body);
        }
      } else {
        await api(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      messageEl.textContent = "Saved.";
    } catch (err) {
      messageEl.textContent = err.message || "Failed to save.";
    }
  };
}

async function loadSettings() {
  let data;
  if (window.dbApi) {
    data = await window.dbApi.dbGetSettings();
  } else {
    data = await api("/api/settings");
  }
  renderForm(document.getElementById("settingsForm"), fields.settings, data.settings || {}, "/api/admin/settings");
  renderForm(document.getElementById("imagesForm"), fields.images, data.images || {}, "/api/admin/home-images");
}

async function loadBookings() {
  let bookings = [];
  try {
    if (window.dbApi) {
      bookings = await window.dbApi.dbGetBookings();
    } else {
      const res = await api("/api/admin/bookings");
      bookings = res.bookings || [];
    }
  } catch (error) {
    console.error("Failed to load bookings:", error);
  }

  document.getElementById("bookingsList").innerHTML = bookings.length ? bookings.map((booking) => `
    <article class="booking-row">
      <div>
        <h3>${booking.name} · ${booking.guests} guests</h3>
        <p>${booking.date} at ${booking.time} · ${booking.phone} ${booking.email ? "· " + booking.email : ""}</p>
        <p>${booking.message || ""}</p>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
        <time>${new Date(booking.createdAt).toLocaleString()}</time>
        <button class="ghost-button" data-delete-booking="${booking.id}">Delete</button>
      </div>
    </article>
  `).join("") : "<p class='muted'>No bookings yet.</p>";
}

async function loadGallery() {
  let gallery = [];
  try {
    if (window.dbApi) {
      gallery = await window.dbApi.dbGetMedia();
    } else {
      const res = await api("/api/gallery");
      gallery = res.gallery || [];
    }
  } catch (error) {
    console.error("Failed to load gallery:", error);
  }

  document.getElementById("galleryList").innerHTML = gallery.length ? gallery.map((item) => `
    <article class="image-row">
      <div><h3>${item.title}</h3><p>${item.type === "item" ? "Individual item image" : "Full menu image"}</p></div>
      <div><img src="${item.imageUrl}" alt=""><button class="ghost-button" data-delete="${item.id}">Delete</button></div>
    </article>
  `).join("") : "<p class='muted'>No gallery images uploaded yet.</p>";
}

async function loadMessages() {
  let messages = [];
  try {
    if (window.dbApi) {
      messages = await window.dbApi.dbGetContactMessages();
    }
  } catch (error) {
    console.error("Failed to load messages:", error);
  }

  const listEl = document.getElementById("messagesList");
  if (listEl) {
    listEl.innerHTML = messages.length ? messages.map((msg) => `
      <article class="booking-row">
        <div>
          <h3>${msg.name} · ${msg.subject || "No Subject"}</h3>
          <p>${msg.message}</p>
          <p class="muted" style="margin-top: 5px; font-size: 0.85em;">
            Email: <a href="mailto:${msg.email}">${msg.email}</a> ${msg.phone ? "· Phone: " + msg.phone : ""}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
          <time>${new Date(msg.createdAt).toLocaleString()}</time>
          <button class="ghost-button" data-delete-message="${msg.id}">Delete</button>
        </div>
      </article>
    `).join("") : "<p class='muted'>No messages yet.</p>";
  }
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("loginMessage");
  message.textContent = "";
  const username = event.target.elements.username.value;
  const password = event.target.elements.password.value;
  try {
    if (window.dbApi) {
      await window.dbApi.dbLogin(username, password);
    } else {
      await api("/api/admin/login", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ username, password }) 
      });
    }
    showDashboard(true);
    await Promise.all([loadSettings(), loadBookings(), loadGallery(), loadMessages()]);
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  if (window.dbApi) {
    await window.dbApi.dbLogout();
  } else {
    await api("/api/admin/logout", { method: "POST" });
  }
  showDashboard(false);
});

document.getElementById("refreshBookings").addEventListener("click", loadBookings);
if (document.getElementById("refreshMessages")) {
  document.getElementById("refreshMessages").addEventListener("click", loadMessages);
}

document.getElementById("bookingsList").addEventListener("click", async (event) => {
  if (!event.target.dataset.deleteBooking) return;
  const id = event.target.dataset.deleteBooking;
  try {
    if (window.dbApi) {
      await window.dbApi.dbDeleteBooking(id);
    }
    loadBookings();
  } catch (error) {
    alert(error.message || "Failed to delete booking.");
  }
});

document.addEventListener("click", async (event) => {
  if (!event.target.dataset.deleteMessage) return;
  const id = event.target.dataset.deleteMessage;
  try {
    if (window.dbApi) {
      await window.dbApi.dbDeleteContactMessage(id);
    }
    loadMessages();
  } catch (error) {
    alert(error.message || "Failed to delete message.");
  }
});

document.getElementById("galleryList").addEventListener("click", async (event) => {
  if (!event.target.dataset.delete) return;
  const id = event.target.dataset.delete;
  try {
    if (window.dbApi) {
      await window.dbApi.dbDeleteMediaItem(id);
    } else {
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" });
    }
    loadGallery();
  } catch (error) {
    alert(error.message || "Failed to delete image.");
  }
});

document.getElementById("galleryForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("galleryMessage");
  message.textContent = "Saving image...";
  try {
    const formData = new FormData(event.target);
    const title = formData.get("title");
    const type = formData.get("type");
    let imageUrl = formData.get("imageUrl");
    const file = event.target.querySelector('input[type="file"]').files[0];

    if (window.dbApi) {
      if (file) {
        imageUrl = await window.dbApi.dbUploadImage(file);
      }
      if (!imageUrl) throw new Error("Upload an image or paste an image URL");
      await window.dbApi.dbAddMediaItem(title, type, imageUrl);
    } else {
      await api("/api/admin/gallery", { method: "POST", body: formData });
    }
    event.target.reset();
    message.textContent = "Image saved.";
    loadGallery();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById("passwordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("passwordMessage");
  message.textContent = "";
  const currentPassword = event.target.elements.currentPassword.value;
  const newPassword = event.target.elements.newPassword.value;
  const confirmPassword = event.target.elements.confirmPassword.value;

  if (newPassword !== confirmPassword) {
    message.textContent = "New passwords do not match.";
    return;
  }

  try {
    if (window.dbApi) {
      await window.dbApi.dbChangePassword(currentPassword, newPassword);
      message.textContent = "Password updated successfully.";
      event.target.reset();
    } else {
      message.textContent = "Password update is only supported in client-side mode.";
    }
  } catch (error) {
    message.textContent = error.message;
  }
});

// Boot authentication check
if (window.dbApi) {
  window.dbApi.dbCheckAuth(async (user) => {
    const authenticated = !!user;
    showDashboard(authenticated);
    if (authenticated) {
      await Promise.all([loadSettings(), loadBookings(), loadGallery(), loadMessages()]);
    }
  });
} else {
  api("/api/admin/me").then(async ({ authenticated }) => {
    showDashboard(authenticated);
    if (authenticated) await Promise.all([loadSettings(), loadBookings(), loadGallery(), loadMessages()]);
  });
}
