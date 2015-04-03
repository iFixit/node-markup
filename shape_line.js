var Fabric = require('fabric').fabric || fabric;
var isNode = typeof window == 'undefined';
var mixin = require('./mixin');

var Line = Fabric.util.createClass(Fabric.Line, {
   type: 'line',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   strokeLineCap: 'round',
   fill: 'transparent',

   // New fields.
   shapeName: 'line',

   /**
    * Resizes this line to make the most sense given the two points (they
    * will determine two opposite corners.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x1 + this._limitDimension(x2 - x1);
      this.y2 = y1 + this._limitDimension(y2 - y1);
      this._setWidthHeight();
      this.setCoords();
   },

   render: function(ctx) {
      this._fixAndRestoreSubPixelPositioning(function() {
         this.callSuper('render', ctx, /* noTransform */ false);
      });
   },

});

var proto = Line.prototype;
mixin(proto, require('./highlighted_stroke.mixin'));
mixin(proto, require('./limit_size'));
mixin(proto, require('./nudge'));
mixin(proto, require('./two_point_interactivity'));


Line.fromObject = function(object) {
   return new Line(object);
};

module.exports.klass = Line;
