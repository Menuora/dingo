(async function () {
  const grid = document.getElementById("publicGallery");
  if (!grid) return;
  try {
    const response = await fetch("/api/gallery");
    const { gallery } = await response.json();
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
