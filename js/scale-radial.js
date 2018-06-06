// Radial scale modified from https://bl.ocks.org/mbostock/6fead6d1378d6df5ae77bb6a719afcb2
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("d3-scale")) :
  typeof define === "function" && define.amd ? define(["exports", "d3-scale"], factory) :
  (factory(global.d3 = global.d3 || {}, global.d3));
}(this, function(exports, d3Scale) {
  'use strict';

  function pow(x) {
    return Math.pow(x, 8);
  }

  function radial() {
    var linear = d3Scale.scaleLinear();

    function scale(x) {
      return Math.pow(linear(x), 1/8);
    }

    scale.domain = function(_) {
      return arguments.length ? (linear.domain(_), scale) : linear.domain();
    };

    scale.nice = function(count) {
      return (linear.nice(count), scale);
    };

    scale.range = function(_) {
      return arguments.length ? (linear.range(_.map(pow)), scale) : linear.range().map(Math.pow(1/8));
    };

    scale.ticks = linear.ticks;
    scale.tickFormat = linear.tickFormat;

    return scale;
  }

  exports.scaleRadial = radial;

  Object.defineProperty(exports, '__esModule', {value: true});
}));