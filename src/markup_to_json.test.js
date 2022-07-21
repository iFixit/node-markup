const fs = require("fs");
const assert = require("node:assert").strict;

const convertMarkupToJSON = require("./markup_to_json");

(async function E2ETestConversion() {
  const testMarkup = fs.readFileSync("./test/993333.markup", "utf8");
  const testJSON = await convertMarkupToJSON(
    testMarkup,
    "./test/993333.source.jpg",
    "./literally.anywhere"
  );

  const expectedJSON = {
    dimensions: { width: 1200, height: 900 },
    finalDimensions: { width: 1032, height: 774 },
    instructions: {
      crop: {
        from: { x: 168, y: 71 },
        size: { width: 1032, height: 774 },
      },
      draw: [
        { circle: { from: { x: 548, y: 671 }, radius: 21, color: "yellow" } },
        {
          rectangle: {
            from: { x: 287, y: 484 },
            size: { width: 28, height: 28 },
            color: "blue",
          },
        },
        { circle: { from: { x: 980, y: 467 }, radius: 113, color: "red" } },
        {
          rectangle: {
            from: { x: 196, y: 200 },
            size: { width: 404, height: 28 },
            color: "black",
          },
        },
      ],
    },
    sourceFile: "./test/993333.source.jpg",
    destinationFile: "./literally.anywhere",
  };

  assert.deepStrictEqual(
    testJSON,
    expectedJSON,
    "converted Markup JSON does not match expected!"
  );
})();
