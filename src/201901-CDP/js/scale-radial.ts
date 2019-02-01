import {scaleLinear} from 'd3-scale';

function pow(x:number) {
  return Math.pow(x, 10);
}

export function scaleRadial() {
  var linear = scaleLinear();

  function scale(x: number) {
    return Math.pow(linear(x), 1/10);
  }

  scale.domain = function(_: Array<Number>) {
    return arguments.length ? (linear.domain(_), scale) : linear.domain();
  };

  scale.nice = function(count: number) {
    return (linear.nice(count), scale);
  };

  scale.range = function(_: Array<number>) {
    return arguments.length
        ? (linear.range(_.map(pow)), scale)
        : linear.range().map((d) => Math.pow(1/10, d));
  };

  scale.ticks = linear.ticks;
  scale.tickFormat = linear.tickFormat;

  return scale;
}

