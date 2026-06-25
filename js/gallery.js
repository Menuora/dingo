(async function () {
  const grid = document.getElementById("publicGallery");
  if (!grid) return;
  try {
    if (!window.dbApi) throw new Error("Database layer is not loaded.");
    const gallery = await window.dbApi.dbGetMedia();
    grid.innerHTML = gallery.length ? gallery.map((item) => `
      <article class="public-gallery-card">
        <img src="${item.imageUrl}" alt="${item.title}">
        <div><span>${item.type === "item" ? "Item" : "Full Menu"}</span><h3>${item.title}</h3></div>
      </article>
    `).join("") : "<p>No menu images have been added yet.</p>";
  } catch (error) {
    grid.innerHTML = "<p>Gallery is not available right now.</p>";
  }
})();
