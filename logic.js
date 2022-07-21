const Geocodio = require("geocodio-library-node");
const _ = require("lodash");
const turf = require("@turf/turf");
const endorsements = require("./endorsements");
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
    divisions.push(
      gres.results[0].fields.state_legislative_districts.senate[0].ocd_id
    );
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

  // extract renocounty
  if (
    gres &&
    gres.results &&
    gres.results[0] &&
    gres.results[0].address_components &&
    gres.results[0].address_components.county &&
    gres.results[0].address_components.county === "Reno County" &&
    gres.results[0].address_components.state === "KS"
  ) {
    // TODO - Update with real GIS stuff when I get it from RNCO
    divisions.push(
      "ocd-division/country:us/state:ks/county:reno/council_district:1",
      "ocd-division/country:us/state:ks/county:reno/council_district:4",
      "ocd-division/country:us/state:ks/county:reno/council_district:5"
    );
  }

  return divisions;
};

const matchToEndorsements = (divisions) => {
  let matched = [];

  if (!divisions) return [];

  divisions.forEach((division) => {
    const matches = _.filter(endorsements, (e) => {
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
//   const sorted = matchToEndorsements(foo);
//   console.log({ sorted });
// }

// main();
