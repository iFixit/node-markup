var sys = require('sys'),
    fs = require('fs'),
    argv = require('optimist')
      .usage('Validate against a schema with a JSON file\n' +
             'Usage: $0 --schema [schema_file] --json [json_file]')
      .demand('schema')
      .describe('schema', 'Text file with applicable JSON schema following ' +
                'http://tools.ietf.org/html/draft-zyp-json-schema-03')
      .demand('json')
      .describe('json', 'Text file with JSON to validate')
      .argv;

var validate = require('json-schema').validate;

var schemaFile = argv.schema;
var jsonFile = argv.json;

fs.readFile(schemaFile, function (err, data) {
   if (err) throw err;

   var schema = JSON.parse(data);

   fs.readFile(jsonFile, function (err, data) {
      if (err) throw err;

      var json = JSON.parse(data);

      var validation = new validate(json, schema);
      var isValid = validation.valid;
      var errors = validation.errors;

      if (isValid) {
         console.log('Validation passed');
      } else {
         console.log('Validation FAILED');

         console.log('Errors reported:');
         for (error in errors) {
            console.log(errors[error]);
         }
         process.exit(-1);
      }
   });
});
