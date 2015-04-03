module.exports = {
   _withSizeLimitations: function(callback) {
      this._limitSize = true;
      callback.apply(this);
      this._limitSize = false;
   },

   _set: function(key, value) {
      var newValue = value;
      if (key === 'scaleX') {
         var newWidth = this.width * value;
         newValue = this._limitDimension(newWidth) / this.width;
      } else if (key === 'scaleY') {
         var newHeight = this.height * value;
         newValue = this._limitDimension(newHeight) / this.height;
      }

      return this.callParent(key, newValue);
   },

   _limitDimension: function(x) {
      // The _isMoving condition seems backwards. It's because fabric has it
      // on during scaling *and* moving but fires this a few times with
      // isMoving off during an actual move.
      if (!this._limitSize && !this.isMoving) return x;

      if (this.minSize !== false) {
         // Sometimes we have to limit negative values too (see: scaleX)
         if (Math.abs(x) < this.minSize)
            return x >= 0 ? this.minSize : -this.minSize;
      }

      if (this.maxSize !== false) {
         if (Math.abs(x) > this.maxSize)
            return x >= 0 ? this.maxSize : -this.maxSize;
      }
      return x;
   }
};

