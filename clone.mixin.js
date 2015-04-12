var Fabric = require('fabric').fabric || fabric;
var extend = Fabric.util.object.extend;

module.exports = {
   toObject: function(propertiesToInclude) {
      return extend(this.callParent(propertiesToInclude), {
         color: this.color,
         borderWidth: this.borderWidth,
         stroke: this.stroke
      });
   },

   clone: function() {
      return new this.constructor(this.toObject());
   }
};
