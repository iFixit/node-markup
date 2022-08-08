const fs = require("fs");
const assert = require("node:assert").strict;

const TestCases = [
  "000066",
  "00CC00",
  "66CCFF",
  "9900CC",
  "993333",
  "lines",
  "simple-lines",
];

const convertMarkupToJSON = require("./markup_to_json");

describe("markup_to_jsonJSON", () => {
  test("Markup converts to expected JSON", async () => {
    TestCases.forEach(async (testcase) => {
      const testMarkup = fs.readFileSync(`./test/${testcase}.markup`, "utf8");
      const expectedJSON = JSON.parse(
        fs.readFileSync(`./test/${testcase}.json`, "utf8")
      );
      const testJSON = await convertMarkupToJSON(
        testMarkup,
        `./test/${testcase}.source.jpg`,
        "./literally.anywhere"
      );

      expect(testJSON).toEqual(expectedJSON);
    });
  });
});
