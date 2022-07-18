function Mixin(proto, properties) {
  for (const property in properties) {
    const value = properties[property];
    if (proto[property] && typeof value == "function") {
      inherit(proto, property, value);
    } else {
      proto[property] = value;
    }
  }
}

function inherit(proto, property, func) {
  var parentFunc = proto[property];
  proto[property] = function () {
    var old = this.callParent;
    this.callParent = parentFunc;
    var ret = func.apply(this, arguments);
    if (old) {
      this.callParent = old;
    }
    return ret;
  };
}

module.exports = Mixin;
