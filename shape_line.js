var Fabric = require('fabric').fabric || fabric;
var isNode = typeof window == 'undefined';
var mixin = require('./mixin');

var Line = Fabric.util.createClass(Fabric.Line, {
   type: 'line',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   strokeLineCap: 'round',
   strokeLineJoin: 'round',
   fill: 'transparent',

   // New fields.
   shapeName: 'line',
   sizeLimits: [0.04, 0.4],

   /**
    * Resizes this line to make the most sense given the two points (they
    * will determine two opposite corners.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      var xd = x2 - x1;
      var yd = y2 - y1;
      var rad = Math.sqrt(xd * xd + yd * yd);
      if (!rad) {
         xd = yd = this._limitDimension(rad);
         var ratio = 1;
      } else {
         var ratio = this._limitDimension(rad) / rad ;
      }
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x1 + ratio * xd;
      this.y2 = y1 + ratio * yd;
      this._setWidthHeight();
      this.setCoords();
   },

   render: function(ctx) {
      this._fixAndRestoreSubPixelPositioning(function() {
         this.callSuper('render', ctx, /* noTransform */ false);
      });
   }
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
