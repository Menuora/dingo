(function () {
  const form = document.querySelector(".regervation_part form");
  if (!form) return;
  form.id = "bookingForm";
  form.innerHTML = `
    <div class="form-row">
      <div class="form-group col-md-6"><input name="name" class="form-control" placeholder="Name *" required></div>
      <div class="form-group col-md-6"><input name="phone" class="form-control" placeholder="Phone number *" required></div>
      <div class="form-group col-md-6"><input name="email" type="email" class="form-control" placeholder="Email address"></div>
      <div class="form-group col-md-6"><input name="guests" type="number" min="1" class="form-control" placeholder="Guests *" required></div>
      <div class="form-group col-md-6"><input name="date" type="date" class="form-control" required></div>
      <div class="form-group col-md-6"><input name="time" type="time" class="form-control" required></div>
      <div class="form-group col-md-12"><textarea name="message" class="form-control" rows="4" placeholder="Message"></textarea></div>
    </div>
    <div class="regerv_btn"><button type="submit" class="btn_4">Book A Table</button></div>
    <p id="bookingMessage" class="booking-message"></p>`;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("bookingMessage");
    message.textContent = "Sending booking...";
    try {
      if (!window.dbApi) throw new Error("Database layer is not loaded.");
      const formData = Object.fromEntries(new FormData(form).entries());
      await window.dbApi.dbAddBooking(formData);
      form.reset();
      message.textContent = "Thank you. Your table request has been received.";
    } catch (error) {
      message.textContent = error.message || "Please check the form and try again.";
    }
  });
})();
