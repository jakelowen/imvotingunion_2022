const express = require("express");
const asyncHandler = require("express-async-handler");

const logic = require("./logic");

const app = express();
const path = require("path");
const router = express.Router();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

router.get("/", (req, res) => {
  res.render("index");
});

router.get(
  "/results",
  asyncHandler(async (req, res) => {
    let address = req.query.address;
    let errorMsg;
    let endorsements = [];

    const divisions = await logic.getDivisions(address).catch(() => {
      errorMsg =
        "Something went wrong please check your address and try again.";
    });

    endorsements = logic.matchToEndorsements(divisions);

    res.render("results", {
      title: "Hey",
      matches: endorsements,
      errorMsg,
    });
  })
);

app.use("/", router);
app.listen(process.env.port || 3000);

console.log("Running at Port 3000");
