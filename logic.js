const Geocodio = require("geocodio-library-node");
const endorsements = require("./endorsements");
const _ = require("lodash");

const geocoder = new Geocodio(process.env.GEOCODIO_API_KEY);

const getDivisions = async (address) => {
  const gres = await geocoder.geocode(address, ["cd118", "stateleg-next"]);

  console.log(gres.results[0].fields.congressional_districts);
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
    console.log({ divisions, rem });
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
