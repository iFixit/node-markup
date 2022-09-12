module.exports = {
  borderWidth: 5,
  strokeWidth: 0.1,
  // in percentage of borderWidth
  outlineWidth: 0.2,
  outlineStyle: "#FFF",

  /**
   * Provide a custom stroke function that draws a fat white line THEN a
   * narrower colored line on top.
   */
  _renderStroke: function (ctx) {
    var myScale = this.scaleX;
    var outline = this._outlineWidth();
    function scale(x) {
      return Math.round(x) / myScale;
    }
    ctx.lineWidth = scale(this.borderWidth + outline);
    ctx.strokeStyle = this.outlineStyle;
    ctx.stroke();

    ctx.lineWidth = scale(this.borderWidth - outline);
    ctx.strokeStyle = this.stroke;
    ctx.stroke();
  },

  _outlineWidth: function () {
    return Math.max(1, Math.round(this.borderWidth * this.outlineWidth));
  },

  /**
   * This is primarily used to get a bounding rect for drawing borders and
   * doing a hit-test for mouse events. We extend the size by the borderWidth
   * cause rectangles and axis lines (horiz or vert) have half their
   * borderWidth outside the actual bounding rect of the shape.
   */
  _calculateCurrentDimensions: function (shouldTransform) {
    var p = this.callParent(shouldTransform);
    var b = this.borderWidth + this._outlineWidth();
    return { x: p.x + b, y: p.y + b };
  },
};
