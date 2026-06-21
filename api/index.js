const express = require("express");
const session = require("express-session");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const rootDir = path.join(__dirname, "..");
const dataDir = process.env.VERCEL ? "/tmp/dingo-data" : path.join(rootDir, ".data");
const dataFile = path.join(dataDir, "site.json");

const defaults = {
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
  },
  gallery: [],
  bookings: []
};

function ensureData() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(defaults, null, 2));
}

function readData() {
  ensureData();
  return { ...defaults, ...JSON.parse(fs.readFileSync(dataFile, "utf8")) };
}

function writeData(data) {
  ensureData();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: "Admin login required" });
}

function mapSrc(input) {
  const value = String(input || "").trim();
  const match = value.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : value;
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "local-dev-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false }
}));
app.use(express.static(rootDir, { extensions: ["html"] }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.get("/api/settings", (req, res) => {
  const data = readData();
  res.json({ settings: data.settings, images: data.images });
});

app.get("/api/gallery", (req, res) => {
  res.json({ gallery: readData().gallery });
});

app.post("/api/bookings", (req, res) => {
  const { name, phone, email, date, time, guests, message } = req.body;
  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({ error: "Name, phone, date, time and guests are required" });
  }
  const data = readData();
  const booking = {
    id: Date.now().toString(36),
    name, phone, email: email || "", date, time, guests, message: message || "",
    createdAt: new Date().toISOString()
  };
  data.bookings.unshift(booking);
  writeData(data);
  res.status(201).json({ booking });
});

app.post("/api/admin/login", (req, res) => {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-this-password";
  if (req.body.username === username && req.body.password === password) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Invalid username or password" });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.admin) });
});

app.get("/api/admin/bookings", requireAdmin, (req, res) => {
  res.json({ bookings: readData().bookings });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const data = readData();
  data.settings = { ...data.settings, ...req.body, googleMapsEmbed: mapSrc(req.body.googleMapsEmbed) };
  writeData(data);
  res.json({ settings: data.settings });
});

app.put("/api/admin/home-images", requireAdmin, (req, res) => {
  const data = readData();
  data.images = { ...data.images, ...req.body };
  writeData(data);
  res.json({ images: data.images });
});

app.post("/api/admin/gallery", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    let secureUrl = req.body.imageUrl;
    if (req.file) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "dingo-template" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
        stream.end(req.file.buffer);
      });
      secureUrl = uploaded.secure_url;
    }
    if (!secureUrl) return res.status(400).json({ error: "Upload an image or paste an image URL" });
    const data = readData();
    const item = {
      id: Date.now().toString(36),
      title: req.body.title || "Menu image",
      type: req.body.type === "item" ? "item" : "menu",
      imageUrl: secureUrl,
      createdAt: new Date().toISOString()
    };
    data.gallery.unshift(item);
    writeData(data);
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: "Cloudinary upload failed. Check credentials and try again." });
  }
});

app.delete("/api/admin/gallery/:id", requireAdmin, (req, res) => {
  const data = readData();
  data.gallery = data.gallery.filter((item) => item.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

module.exports = app;
