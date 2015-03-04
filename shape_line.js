var Fabric = require('fabric').fabric || fabric;
var extend = Fabric.util.object.extend;
var isNode = typeof window == 'undefined';

var Line = Fabric.util.createClass(Fabric.Line, {
   type: 'line',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   fill: 'transparent',

   // New fields.
   shapeName: 'line',

   // Min and Max size to enforce (false == no enforcement)
   minSize: false,
   maxSize: false,

   /**
    * Resizes this rectangle to make the most sense given the two points (they
    * will determine two opposite corners.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this._setWidthHeight();
      this.setCoords();
   }
});

Line.fromObject = function(object) {
   return new Line(object);
};

extend(Line.prototype, require('./two_point_interactivity'));
extend(Line.prototype, require('./highlighted_stroke.mixin'));

module.exports.klass = Line;
