var Fabric = require('fabric').fabric;

var Gap = Fabric.util.createClass(require('./shape_line').klass, {
   type: 'gap',
   shapeName: 'gap',
   // Min and Max size to enforce (false == no enforcement)
   sizeLimits: [0.03, 0.95],

   _stroke: function(ctx) {
      var angle = this._getAngle();
      var rad = this._getLength();
      var canvasSize = this._canvasSize();

      var size = Math.max(this.borderWidth * 2, canvasSize / 46);
      var headWidthRadians = Math.PI / 2;
      var x  = Math.cos(angle - headWidthRadians) * size;
      var y  = Math.sin(angle - headWidthRadians) * size;
      var x2 = Math.cos(angle + headWidthRadians) * size;
      var y2 = Math.sin(angle + headWidthRadians) * size;
      ctx.translate(-this._getDeltaX() / 2, -this._getDeltaY() / 2);
      ctx.moveTo(x,  y);
      ctx.lineTo(x2, y2);
      ctx.translate(this._getDeltaX(), this._getDeltaY());
      ctx.moveTo(x,  y);
      ctx.lineTo(x2, y2);

      this.callSuper('_stroke', ctx);
   }
});

module.exports.klass = Gap;
