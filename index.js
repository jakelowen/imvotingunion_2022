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
        "Something went wrong please check your address and try again. If problems persist contact jake@whlaborfed.org.";
    });

    endorsements = logic.matchToEndorsements(divisions);

    if (endorsements.length === 0) {
      errorMsg =
        'We found no endorsements for your address. Please verify you used your FULL address including city, state & zipcode. Like "3340 W. Douglas, Wichita KS 67203". If problems persist contact jake@whlaborfed.org.';
    }

    res.render("results", {
      title: "Hey",
      matches: endorsements,
      errorMsg,
    });
  })
);

app.use("/", router);
app.listen(process.env.port || 8080);

console.log("Running at Port 8080");
