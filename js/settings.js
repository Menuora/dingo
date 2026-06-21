(async function () {
  const defaults = {
    settings: { restaurantName: "Dingo Restaurant", facebookLink: "#", instagramLink: "#", twitterLink: "#", openingTime: "10:00 AM", closingTime: "11:00 PM", googleMapsEmbed: "" },
    images: {}
  };
  let data = defaults;
  try {
    const response = await fetch("/api/settings");
    if (response.ok) data = await response.json();
  } catch (error) {}
  const settings = { ...defaults.settings, ...(data.settings || {}) };
  const images = data.images || {};

  document.querySelectorAll(".navbar-brand").forEach((brand) => {
    brand.insertAdjacentHTML("beforeend", `<span class="site-brand-name">${settings.restaurantName}</span>`);
  });

  const nav = document.querySelector(".navbar-nav");
  if (nav && !document.querySelector('a[href="gallery.html"]')) {
    nav.querySelectorAll(".dropdown").forEach((item) => item.remove());
    const item = document.createElement("li");
    item.className = "nav-item";
    item.innerHTML = '<a class="nav-link" href="gallery.html">Images</a>';
    const contact = nav.querySelector('a[href="contact.html"]')?.closest("li");
    nav.insertBefore(item, contact || null);
  }

  const setBg = (selector, url) => {
    if (!url) return;
    document.querySelectorAll(selector).forEach((el) => { el.style.backgroundImage = `url("${url}")`; });
  };
  setBg(".banner_part", images.heroImage1);
  setBg(".intro_video_bg", images.heroImage2);
  setBg(".regervation_part", images.bookingImage);
  if (location.pathname.includes("food_menu")) setBg(".breadcrumb_bg", images.menuHeaderImage);
  if (location.pathname.includes("gallery")) setBg(".breadcrumb_bg", images.galleryHeaderImage);
  if (location.pathname.includes("contact")) setBg(".breadcrumb_bg", images.contactHeaderImage);
  document.querySelectorAll(".about_img img").forEach((img, index) => {
    const next = index ? images.aboutImage2 : images.aboutImage1;
    if (next) img.src = next;
  });

  const footer = document.querySelector(".footer-area");
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="row">
          <div class="col-lg-4 col-md-6"><div class="single-footer-widget"><h4>${settings.restaurantName}</h4><p>Serving memorable meals with warm hospitality every day.</p></div></div>
          <div class="col-lg-3 col-md-6"><div class="single-footer-widget"><h4>Opening Hours</h4><p>${settings.openingTime} - ${settings.closingTime}</p><div class="copyright_social_icon text-left"><a href="${settings.facebookLink}"><i class="fab fa-facebook-f"></i></a><a href="${settings.twitterLink}"><i class="fab fa-twitter"></i></a><a href="${settings.instagramLink}"><i class="fab fa-instagram"></i></a></div></div></div>
          <div class="col-lg-5 col-md-12"><div class="single-footer-widget"><h4>Find Us</h4><div class="site-map">${settings.googleMapsEmbed ? `<iframe src="${settings.googleMapsEmbed}" loading="lazy"></iframe>` : "<p>Add a Google Maps embed from the admin dashboard.</p>"}</div></div></div>
        </div>
        <div class="copyright_part_text"><div class="row"><div class="col-lg-12"><p class="footer-text m-0">Copyright &copy;${new Date().getFullYear()} ${settings.restaurantName}. All rights reserved.</p></div></div></div>
      </div>`;
  }
})();
