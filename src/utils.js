module.exports = {
  /**
   * Just like parseInt, but fixed to base-10
   */
  Int: function (str) {
     return parseInt(str, 10);
  },

  /**
   * Cycles through an object and changes all numeric fields to ints
   * where necessary. 'context' is used for exception reporting and can be
   * left unset upon invocation.
   */
  cleanJSON: function cleanJSON(json, context) {
     if (!context)
        context = "root";

     var integerProperties = [
        'x'
       ,'y'
       ,'width'
       ,'height'
       ,'radius'
       ,'strokeWidth'
     ];
     const isIntegerProperty = (property) => integerProperties.indexOf(property) != -1;

     for (var property in json) {
        if (typeof(json[property]) == 'object') {
           cleanJSON(json[property], context + '.' + property);
        }
        else if (isIntegerProperty(property)) {
           if (typeof(json[property]) == 'string') {
            json[property] = parseInt(json[property]);
              if (isNaN(json[property])) {
                 var msg = "In '" + context + "': property '" + property +
                  "' is not a number.";
                 throw msg;
              }
           }
        }
     }
  }
}
