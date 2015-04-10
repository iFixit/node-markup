var Fabric = require('fabric').fabric || fabric;
var mixin = require('./mixin');

var Arrow = Fabric.util.createClass(require('./shape_line').klass, {
   type: 'arrow',

   _stroke: function(ctx) {
      var angle = this._getAngle();
      var rad = this._getLength();

      var size = Math.min((rad / 6) + this.maxSize / 40, 30);
      this.borderWidth = Math.max(Math.min((rad / 40) + this.maxSize / 60, 6), 4);
      var headWidthRadians = Math.PI / 6;
      var x  = Math.cos(angle - headWidthRadians) * size;
      var y  = Math.sin(angle - headWidthRadians) * size;
      var x2 = Math.cos(angle + headWidthRadians) * size;
      var y2 = Math.sin(angle + headWidthRadians) * size;
      ctx.translate(-this._getDeltaX()/2, -this._getDeltaY()/2);
      ctx.lineTo(x, y);
      ctx.moveTo(0, 0);
      ctx.lineTo(x2, y2);

      this.callSuper('_stroke', ctx);
   },

   _getAngle: function() {
      return Math.atan2(this._getDeltaY(), this._getDeltaX());
   },

   _getDeltaX: function() {
      return this.x1 <= this.x2 ? -this.width : this.width;
   },

   _getDeltaY: function() {
      return this.y1 <= this.y2 ? -this.height : this.height;
   },

   _getLength: function() {
      return Math.sqrt(this.width * this.width +
                       this.height * this.height);
   }
});

module.exports.klass = Arrow;
