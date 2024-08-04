const Geocodio = require("geocodio-library-node");
const _ = require("lodash");
const turf = require("@turf/turf");
// const electeds = require("./electeds")
const sgcocommission = require("./sgcocommission");

const geocoder = new Geocodio(process.env.GEOCODIO_API_KEY);

const getDivisions = async (address) => {
  const gres = await geocoder.geocode(address, ["cd118", "stateleg-next"]);

  // console.log(gres.results[0].fields.congressional_districts);
  const divisions = [];

  // extract cd
  if (
    gres &&
    gres.results &&
    gres.results[0] &&
    gres.results[0].fields &&
    gres.results[0].fields.congressional_districts &&
    gres.results[0].fields.congressional_districts[0] &&
    gres.results[0].fields.congressional_districts[0].ocd_id
  ) {
    divisions.push(gres.results[0].fields.congressional_districts[0].ocd_id);

    // build in state

    const rem = gres.results[0].fields.congressional_districts[0].ocd_id.match(
      /ocd-division\/country:us\/state:\w\w/
    );

    if (rem && rem[0]) {
      divisions.push(rem[0]);
    }
  }

  // extract sldu
  if (
    gres &&
    gres.results &&
    gres.results[0] &&
    gres.results[0].fields &&
    gres.results[0].fields.state_legislative_districts &&
    gres.results[0].fields.state_legislative_districts.senate &&
    gres.results[0].fields.state_legislative_districts.senate[0] &&
    gres.results[0].fields.state_legislative_districts.senate[0].ocd_id
  ) {
    const senateDistrictOcdId =
      gres.results[0].fields.state_legislative_districts.senate[0].ocd_id;
    divisions.push(senateDistrictOcdId);

    const sboeDistrictMap = {
      "ocd-division/country:us/state:ks/sldu:1": 1,
      "ocd-division/country:us/state:ks/sldu:5": 1,
      "ocd-division/country:us/state:ks/sldu:18": 1,
      "ocd-division/country:us/state:ks/sldu:22": 1,
      "ocd-division/country:us/state:ks/sldu:4": 2,
      "ocd-division/country:us/state:ks/sldu:6": 2,
      "ocd-division/country:us/state:ks/sldu:7": 2,
      "ocd-division/country:us/state:ks/sldu:8": 2,
      "ocd-division/country:us/state:ks/sldu:11": 3,
      "ocd-division/country:us/state:ks/sldu:23": 3,
      "ocd-division/country:us/state:ks/sldu:35": 3,
      "ocd-division/country:us/state:ks/sldu:37": 3,
      "ocd-division/country:us/state:ks/sldu:3": 4,
      "ocd-division/country:us/state:ks/sldu:9": 4,
      "ocd-division/country:us/state:ks/sldu:10": 4,
      "ocd-division/country:us/state:ks/sldu:21": 4,
      "ocd-division/country:us/state:ks/sldu:36": 5,
      "ocd-division/country:us/state:ks/sldu:38": 5,
      "ocd-division/country:us/state:ks/sldu:39": 5,
      "ocd-division/country:us/state:ks/sldu:40": 5,
      "ocd-division/country:us/state:ks/sldu:2": 6,
      "ocd-division/country:us/state:ks/sldu:17": 6,
      "ocd-division/country:us/state:ks/sldu:19": 6,
      "ocd-division/country:us/state:ks/sldu:20": 6,
      "ocd-division/country:us/state:ks/sldu:24": 7,
      "ocd-division/country:us/state:ks/sldu:31": 7,
      "ocd-division/country:us/state:ks/sldu:33": 7,
      "ocd-division/country:us/state:ks/sldu:34": 7,
      "ocd-division/country:us/state:ks/sldu:25": 8,
      "ocd-division/country:us/state:ks/sldu:28": 8,
      "ocd-division/country:us/state:ks/sldu:29": 8,
      "ocd-division/country:us/state:ks/sldu:30": 8,
      "ocd-division/country:us/state:ks/sldu:12": 9,
      "ocd-division/country:us/state:ks/sldu:13": 9,
      "ocd-division/country:us/state:ks/sldu:14": 9,
      "ocd-division/country:us/state:ks/sldu:15": 9,
      "ocd-division/country:us/state:ks/sldu:16": 10,
      "ocd-division/country:us/state:ks/sldu:26": 10,
      "ocd-division/country:us/state:ks/sldu:27": 10,
      "ocd-division/country:us/state:ks/sldu:32": 10,
    };

    const sboeDistrict = sboeDistrictMap[senateDistrictOcdId];
    if (sboeDistrict) {
      divisions.push(`ocd-division/country:us/state:ks/sboe:${sboeDistrict}`);
    }
  }

  // extract sldl
  if (
    gres &&
    gres.results &&
    gres.results[0] &&
    gres.results[0].fields &&
    gres.results[0].fields.state_legislative_districts &&
    gres.results[0].fields.state_legislative_districts.house &&
    gres.results[0].fields.state_legislative_districts.house[0] &&
    gres.results[0].fields.state_legislative_districts.house[0].ocd_id
  ) {
    divisions.push(
      gres.results[0].fields.state_legislative_districts.house[0].ocd_id
    );
  }

  // extract sgco
  if (
    gres &&
    gres.results &&
    gres.results[0] &&
    gres.results[0].address_components &&
    gres.results[0].address_components.county &&
    gres.results[0].address_components.county === "Sedgwick County" &&
    gres.results[0].address_components.state === "KS"
  ) {
    sgcocommission.features.forEach((f) => {
      var multiPoly = turf.multiPolygon(f.geometry.coordinates);
      var point = turf.point([
        gres.results[0].location.lng,
        gres.results[0].location.lat,
      ]);

      const bw = turf.booleanWithin(point, multiPoly);
      if (bw) {
        divisions.push(
          `ocd-division/country:us/state:ks/county:sedgwick/council_district:${f.properties.BOCCDistNO}`
        );
      }
    });
  }

  // // extract renocounty
  // if (
  //   gres &&
  //   gres.results &&
  //   gres.results[0] &&
  //   gres.results[0].address_components &&
  //   gres.results[0].address_components.county &&
  //   gres.results[0].address_components.county === "Reno County" &&
  //   gres.results[0].address_components.state === "KS"
  // ) {
  //   // TODO - Update with real GIS stuff when I get it from RNCO
  //   divisions.push(
  //     "ocd-division/country:us/state:ks/county:reno/council_district:1",
  //     "ocd-division/country:us/state:ks/county:reno/council_district:4",
  //     "ocd-division/country:us/state:ks/county:reno/council_district:5"
  //   );
  // }

  return divisions;
};

const matchToEndorsements = (divisions, list) => {
  let matched = [];

  if (!divisions) return [];

  divisions.forEach((division) => {
    const matches = _.filter(list, (e) => {
      return e.division == division;
    });

    matched = matched.concat(matches);
  });

  return _.sortBy(matched, ["sortOrder"]);
};

module.exports = {
  getDivisions,
  matchToEndorsements,
};

// async function main() {
//   const foo = await getDivisions("765 Ash St, Lawrence KS 66044");
//   console.log({ foo });
//   const sorted = matchToEndorsements(foo, endorsements);
//   console.log({ sorted });
// }

// main();
