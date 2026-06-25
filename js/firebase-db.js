// Firebase and Fallback Client-Side Database Layer for Dingo Template

(function () {
  const DEFAULTS = {
    settings: {
      restaurantName: "Dingo Restaurant",
      facebookLink: "#",
      instagramLink: "#",
      twitterLink: "#",
      googleMapsEmbed: "",
      openingTime: "10:00 AM",
      closingTime: "11:00 PM"
    },
    images: {
      heroImage1: "img/banner_bg.png",
      heroImage1Secondary: "img/banner_overlay.png",
      heroImage2: "img/intro_video_bg.png",
      heroImage2Secondary: "img/about_overlay.png",
      aboutImage1: "img/about.png",
      aboutImage2: "img/about_overlay.png",
      bookingImage: "img/booking_tabel_bg.png",
      menuHeaderImage: "img/breadcrumb.png",
      galleryHeaderImage: "img/breadcrumb.png",
      contactHeaderImage: "img/breadcrumb.png"
    }
  };

  // Helper to detect if Firebase credentials are fully configured
  function isFirebaseConfigured() {
    const config = window.ENV && window.ENV.firebase;
    return !!(
      config &&
      config.apiKey &&
      !config.apiKey.includes("YOUR_FIREBASE_API_KEY") &&
      config.projectId &&
      !config.projectId.includes("YOUR_FIREBASE_PROJECT_ID")
    );
  }

  const useFirebase = isFirebaseConfigured();
  let db = null;
  let auth = null;

  if (useFirebase) {
    console.log("Dingo: Initializing Firebase SDK backend...");
    try {
      firebase.initializeApp(window.ENV.firebase);
      db = firebase.firestore();
      auth = firebase.auth();
    } catch (e) {
      console.error("Failed to initialize Firebase SDK:", e);
    }
  } else {
    console.warn("Dingo: Firebase credentials not set or incomplete. Running in Client-Side Fallback Mode (using LocalStorage).");
  }

  // --- LOCAL FALLBACK HELPERS ---
  function getLocal(key, defaultValue) {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    try {
      return JSON.parse(val);
    } catch (e) {
      return defaultValue;
    }
  }

  function setLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Ensure initial fallback data exists
  if (!useFirebase) {
    if (!localStorage.getItem("dingo_settings")) {
      setLocal("dingo_settings", DEFAULTS.settings);
    }
    if (!localStorage.getItem("dingo_images")) {
      setLocal("dingo_images", DEFAULTS.images);
    }
    if (!localStorage.getItem("dingo_bookings")) {
      setLocal("dingo_bookings", []);
    }
    if (!localStorage.getItem("dingo_media")) {
      setLocal("dingo_media", []);
    }
    if (!localStorage.getItem("dingo_admin_password")) {
      localStorage.setItem("dingo_admin_password", "change-this-password");
    }
  }

  // --- INTERFACE EXPORTS ---
  const dbApi = {
    isFirebaseMode: function () {
      return useFirebase;
    },

    // 1. GET SETTINGS & IMAGES
    dbGetSettings: async function () {
      if (useFirebase) {
        try {
          const settingsDoc = await db.collection("config").doc("settings").get();
          const imagesDoc = await db.collection("config").doc("images").get();

          const settings = settingsDoc.exists ? settingsDoc.data() : DEFAULTS.settings;
          const images = imagesDoc.exists ? imagesDoc.data() : DEFAULTS.images;

          return { settings, images };
        } catch (e) {
          console.error("Error reading Firestore settings:", e);
          return { settings: DEFAULTS.settings, images: DEFAULTS.images };
        }
      } else {
        return {
          settings: getLocal("dingo_settings", DEFAULTS.settings),
          images: getLocal("dingo_images", DEFAULTS.images)
        };
      }
    },

    // 2. GET MEDIA ITEMS (GALLERY)
    dbGetMedia: async function () {
      if (useFirebase) {
        try {
          const snapshot = await db.collection("media").orderBy("createdAt", "desc").get();
          const items = [];
          snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
          });
          return items;
        } catch (e) {
          console.error("Error fetching Firestore media:", e);
          return [];
        }
      } else {
        return getLocal("dingo_media", []);
      }
    },

    // 3. GET BOOKINGS
    dbGetBookings: async function () {
      if (useFirebase) {
        try {
          const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").get();
          const bookings = [];
          snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
          });
          return bookings;
        } catch (e) {
          console.error("Error fetching Firestore bookings:", e);
          return [];
        }
      } else {
        return getLocal("dingo_bookings", []);
      }
    },

    // 4. ADD BOOKING
    dbAddBooking: async function (bookingData) {
      const booking = {
        name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.email || "",
        date: bookingData.date,
        time: bookingData.time,
        guests: bookingData.guests || "1",
        message: bookingData.message || "",
        createdAt: new Date().toISOString()
      };

      if (useFirebase) {
        const docRef = await db.collection("bookings").add(booking);
        booking.id = docRef.id;
        return booking;
      } else {
        const list = getLocal("dingo_bookings", []);
        booking.id = Date.now().toString(36);
        list.unshift(booking);
        setLocal("dingo_bookings", list);
        return booking;
      }
    },

    // 5. DELETE BOOKING
    dbDeleteBooking: async function (bookingId) {
      if (useFirebase) {
        await db.collection("bookings").doc(bookingId).delete();
      } else {
        let list = getLocal("dingo_bookings", []);
        list = list.filter(b => b.id !== bookingId);
        setLocal("dingo_bookings", list);
      }
      return { ok: true };
    },

    // 6. UPDATE SETTINGS
    dbUpdateSettings: async function (newSettings) {
      if (useFirebase) {
        const googleMapsEmbed = dbApi.normalizeMap(newSettings.googleMapsEmbed);
        const data = { ...newSettings, googleMapsEmbed };
        await db.collection("config").doc("settings").set(data, { merge: true });
      } else {
        const current = getLocal("dingo_settings", DEFAULTS.settings);
        const googleMapsEmbed = dbApi.normalizeMap(newSettings.googleMapsEmbed);
        const updated = { ...current, ...newSettings, googleMapsEmbed };
        setLocal("dingo_settings", updated);
      }
      return { ok: true };
    },

    // 7. UPDATE HOMEPAGE IMAGES
    dbUpdateImages: async function (newImages) {
      if (useFirebase) {
        await db.collection("config").doc("images").set(newImages, { merge: true });
      } else {
        const current = getLocal("dingo_images", DEFAULTS.images);
        const updated = { ...current, ...newImages };
        setLocal("dingo_images", updated);
      }
      return { ok: true };
    },

    // 8. ADD MEDIA ITEM
    dbAddMediaItem: async function (title, type, imageUrl) {
      const item = {
        title: title || (type === "item" ? "Menu Item" : "Full Menu"),
        type: type === "item" ? "item" : "menu",
        imageUrl,
        createdAt: new Date().toISOString()
      };

      if (useFirebase) {
        const docRef = await db.collection("media").add(item);
        item.id = docRef.id;
        return item;
      } else {
        const list = getLocal("dingo_media", []);
        item.id = Date.now().toString(36);
        list.unshift(item);
        setLocal("dingo_media", list);
        return item;
      }
    },

    // 9. DELETE MEDIA ITEM
    dbDeleteMediaItem: async function (itemId) {
      if (useFirebase) {
        await db.collection("media").doc(itemId).delete();
      } else {
        let list = getLocal("dingo_media", []);
        list = list.filter(item => item.id !== itemId);
        setLocal("dingo_media", list);
      }
      return { ok: true };
    },

    // 10. AUTH: LOGIN
    dbLogin: async function (usernameOrEmail, password) {
      if (useFirebase) {
        let email = usernameOrEmail.trim();
        if (!email.includes("@")) {
          // If no domain is provided, fallback to the configured admin email domain if present
          const envAdmin = window.ENV && window.ENV.admin;
          const domain = envAdmin && envAdmin.email && envAdmin.email.includes("@") 
            ? envAdmin.email.split("@")[1] 
            : "dingo.com";
          email = email + "@" + domain;
        }
        try {
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          await dbApi.ensureFirestoreInitialized();
          return userCredential.user;
        } catch (error) {
          // Auto-create admin account in Firebase if not found and credentials match env.js configuration
          const envAdmin = window.ENV && window.ENV.admin;
          if (
            (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") &&
            envAdmin &&
            email.toLowerCase() === envAdmin.email.trim().toLowerCase() &&
            password === envAdmin.password
          ) {
            console.log("Admin account not found in Firebase. Auto-creating admin user using credentials from env.js...");
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await dbApi.ensureFirestoreInitialized();
            return userCredential.user;
          }
          throw error;
        }
      } else {
        const envAdmin = window.ENV && window.ENV.admin;
        const defaultEmail = envAdmin && envAdmin.email ? envAdmin.email.trim() : "admin@dingo.com";
        const defaultPassword = envAdmin && envAdmin.password ? envAdmin.password : "change-this-password";

        const storedPassword = localStorage.getItem("dingo_admin_password") || defaultPassword;
        const inputUser = usernameOrEmail.trim().toLowerCase();
        const expectedUser = defaultEmail.toLowerCase();
        const expectedPrefix = expectedUser.split("@")[0];

        if (
          (inputUser === expectedUser || inputUser === expectedPrefix || inputUser === "admin") &&
          password === storedPassword
        ) {
          sessionStorage.setItem("dingo_admin_auth", "true");
          return { email: defaultEmail, uid: "fallback-admin-id" };
        } else {
          throw new Error("Invalid admin username or password.");
        }
      }
    },

    // 11. AUTH: LOGOUT
    dbLogout: async function () {
      if (useFirebase) {
        await auth.signOut();
      } else {
        sessionStorage.removeItem("dingo_admin_auth");
      }
      return { ok: true };
    },

    // 12. AUTH: CHECK ACTIVE SESSION
    dbCheckAuth: function (callback) {
      if (useFirebase) {
        auth.onAuthStateChanged(function (user) {
          callback(user);
        });
      } else {
        const isAuthed = sessionStorage.getItem("dingo_admin_auth") === "true";
        setTimeout(() => {
          const envAdmin = window.ENV && window.ENV.admin;
          const defaultEmail = envAdmin && envAdmin.email ? envAdmin.email.trim() : "admin@dingo.com";
          callback(isAuthed ? { email: defaultEmail, uid: "fallback-admin-id" } : null);
        }, 50);
      }
    },

    // 13. AUTH: CHANGE PASSWORD
    dbChangePassword: async function (currentPassword, newPassword) {
      if (useFirebase) {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
      } else {
        const envAdmin = window.ENV && window.ENV.admin;
        const defaultPassword = envAdmin && envAdmin.password ? envAdmin.password : "change-this-password";
        const storedPassword = localStorage.getItem("dingo_admin_password") || defaultPassword;
        if (currentPassword !== storedPassword) {
          throw new Error("Current password is incorrect.");
        }
        localStorage.setItem("dingo_admin_password", newPassword);
      }
      return { ok: true };
    },

    // 14. HELPER: CLOUDINARY CLIENT UPLOAD
    dbUploadImage: async function (file) {
      const cloudName = window.ENV && window.ENV.cloudinary && window.ENV.cloudinary.cloudName;
      const uploadPreset = window.ENV && window.ENV.cloudinary && window.ENV.cloudinary.uploadPreset;

      const isCloudinaryConfigured = cloudName && !cloudName.includes("YOUR_CLOUDINARY_CLOUD_NAME") &&
                                     uploadPreset && !uploadPreset.includes("YOUR_CLOUDINARY_UPLOAD_PRESET");

      if (isCloudinaryConfigured) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Cloudinary upload failed");
        }
        const data = await res.json();
        return data.secure_url;
      } else {
        // Fallback: convert file to Base64 dataURL for client-side persistence preview
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (e) => reject(new Error("File reading failed"));
          reader.readAsDataURL(file);
        });
      }
    },

    normalizeMap: function (input) {
      const value = String(input || "").trim();
      const srcMatch = value.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : value;
    },

    // Helper to auto-create Firestore default docs if they don't exist
    ensureFirestoreInitialized: async function () {
      if (!useFirebase) return;
      try {
        const settingsRef = db.collection("config").doc("settings");
        const settingsDoc = await settingsRef.get();
        if (!settingsDoc.exists) {
          await settingsRef.set(DEFAULTS.settings);
        }

        const imagesRef = db.collection("config").doc("images");
        const imagesDoc = await imagesRef.get();
        if (!imagesDoc.exists) {
          await imagesRef.set(DEFAULTS.images);
        }
      } catch (e) {
        console.warn("Failed to auto-initialize defaults in Firestore (might be due to permission rules):", e);
      }
    },
    // 15. ADD CONTACT MESSAGE
    dbAddContactMessage: async function (messageData) {
      const message = {
        name: messageData.name,
        email: messageData.email,
        phone: messageData.number || messageData.phone || "",
        subject: messageData.subject || "",
        message: messageData.message,
        createdAt: new Date().toISOString()
      };

      if (useFirebase) {
        await db.collection("messages").add(message);
      } else {
        const list = getLocal("dingo_messages", []);
        message.id = Date.now().toString(36);
        list.unshift(message);
        setLocal("dingo_messages", list);
      }
      return { ok: true };
    },

    // 16. GET CONTACT MESSAGES
    dbGetContactMessages: async function () {
      if (useFirebase) {
        try {
          const snapshot = await db.collection("messages").orderBy("createdAt", "desc").get();
          const messages = [];
          snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
          });
          return messages;
        } catch (e) {
          console.error("Error fetching Firestore messages:", e);
          return [];
        }
      } else {
        return getLocal("dingo_messages", []);
      }
    },

    // 17. DELETE CONTACT MESSAGE
    dbDeleteContactMessage: async function (messageId) {
      if (useFirebase) {
        await db.collection("messages").doc(messageId).delete();
      } else {
        let list = getLocal("dingo_messages", []);
        list = list.filter(m => m.id !== messageId);
        setLocal("dingo_messages", list);
      }
      return { ok: true };
    }
  };

  window.dbApi = dbApi;
})();
