var Fabric = require('fabric').fabric || fabric;
var mixin = require('./mixin');

var Arrow = Fabric.util.createClass(require('./shape_line').klass, {
   type: 'arrow',
   shapeName: 'arrow',

   _stroke: function(ctx) {
      var angle = this._getAngle();
      var rad = this._getLength();
      var canvasSize = this._canvasSize();

      var size = Math.min(canvasSize / 16, (rad / 6) + canvasSize / 80);
      this.borderWidth = Math.max(4, Math.min(canvasSize / 80, (rad / 40) + canvasSize / 160));
      var headWidthRadians = Math.PI / 6;
      var x  = Math.cos(angle - headWidthRadians) * size;
      var y  = Math.sin(angle - headWidthRadians) * size;
      var x2 = Math.cos(angle + headWidthRadians) * size;
      var y2 = Math.sin(angle + headWidthRadians) * size;
      ctx.translate(-this._getDeltaX()/2, -this._getDeltaY()/2);
      ctx.moveTo(x, y);
      ctx.lineTo(0, 0);
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
