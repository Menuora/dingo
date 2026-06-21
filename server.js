const app = require("./api/index");

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dingo template running at http://localhost:${port}`);
});
