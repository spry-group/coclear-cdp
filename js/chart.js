var categories = ['stage data not available', 'downstream', 'manufacturing', 'upstream'],
    svg,
    width,
    height,
    innerRadius = 150,
    outerRadius,
    tooltip,
    ttWidth,
    g, // Svg group
    x, // x scale (companies)
    y, // y scale (carbon intensity)
    z, // z scale (categories)
    yAxis,
    lastMouseOver;


function createChart(data) {
  svg = d3.select('#chart');
  width = + svg.attr('width');
  height = + svg.attr('height');
  outerRadius = Math.min(width, height) / 2 - 25;
  tooltip = d3.select('#tooltip');
  ttWidth = + tooltip.attr('width');

  g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  g.append('g')
   .attr('class', 'deltaCircles')

  x = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .align(0);

  y = d3.scaleRadial()
            .range([innerRadius, outerRadius])

  z = d3.scaleOrdinal()
            .range(['#686667', '#949fbd', '#755270', '#fd8d00'])
            .domain(categories);

  yAxis = g.append('g').attr('text-anchor', 'middle');
  yAxis.append('text')
      .attr('dy', '-' + (height / 2 - 7) + 'px')
      .text('Carbon Intensity');
  updateChart(data);
}

function updateChart(updatedData) {
  x.domain(updatedData.map(function(d) { return d.id; }));
  y.domain([0, d3.max(updatedData, function(d) { return d.carbonInt; })]);

  // Bars
  var arcs = g.selectAll('.arc')
              .data(d3.stack().keys(categories)(updatedData));
  arcs.exit().remove();

  let arcsEnter = arcs.enter()
                      .append('g')
                      .attr('class', 'arc');

  let paths = arcsEnter.merge(arcs)
                       .attr('fill', function(d) { return z(d.key); })
                       .selectAll('path')
                       .data(function(d) { return d; });
  paths.exit().remove();

  let pathsEnter = paths.enter().append('path');

  pathsEnter.merge(paths)
            .attr('d', d3.arc()
              .innerRadius(function(d) { return y(d[0]); })
              .outerRadius(function(d) { return y(d[1]); })
              .startAngle(function(d) { return x(d.data.id); })
                                                        // cap band width to ensure it doesn't look like a pie chart
              .endAngle(function(d) { return x(d.data.id) + (x.bandwidth() < 0.5 ? x.bandwidth() : 0.5); })
              .padAngle(0.01)
              .padRadius(innerRadius)
            ).on('mouseover', showToolTip)
             .on('mouseout', removeToolTip);

  // Delta circles
  let circleRadius = innerRadius / updatedData.length * 0.75;
      circleRadius = circleRadius < 1 ? 1 : circleRadius;

  let emissionDeltas = g.select('.deltaCircles')
                        .selectAll('.emissionDelta')
                        .data(updatedData.filter(d => d.footprintChangePer));
  emissionDeltas.exit().remove();

  let emissionDeltasEnter = emissionDeltas.enter()
                                          .append('circle')
                                            .attr('class', 'emissionDelta')
  emissionDeltasEnter.exit().remove();

  let circles = emissionDeltasEnter.merge(emissionDeltas)
                                   .attr('fill', function(d) {
                                     return d.footprintChangePer <= 0 ? '#097625' : '#f32033';
                                   })
                                   .attr('stroke', 'none')
                                   .attr('r', circleRadius)
                                   .attr('transform', function(d) {
                                      return 'rotate(' + (
                                        ((x(d.id) + x.bandwidth() / 2) * 180 - circleRadius) / Math.PI - 90
                                      ) + ') translate(' + (innerRadius - circleRadius * 2.5) + ', 0)';
                                   });
  circles.exit().remove();

  drawYAxis(updatedData);
}

function showToolTip(d) {
  lastMouseOver = d.data.id;
  // Update tooltip data
  d3.select('#tt-company').html(d.data.company);
  d3.select('#tt-name').html(d.data.name);
  d3.select('#tt-desc').html(d.data.desc);

  if (d.data.footprintChangePer) {
    let html = '<span class="deltaCircle ' + (d.data.footprintChangePer <= 0 ? 'decrease' : 'increase') + '"></span>' +
                d.data.footprintChangePer + '% in product emissions as a result of: ' + d.data.footprintChangeReason;
    d3.select('#tt-footprintChange').html(html);
  } else {
    d3.select('#tt-footprintChange').html('No change / no data');
  }

  d3.select('#tt-footprintChangeReason').html(d.data.footprintChangeReason);

  d3.select('#tt-carbonInt').html(d.data.carbonInt);
  d3.select('#tt-upstreamPer').html(d.data.upstreamPer || 'Unknown');
  d3.select('#tt-manufacturingPer').html(d.data.manufacturingPer || 'Unknown');
  d3.select('#tt-downstreamPer').html(d.data.downstreamPer || 'Unknown');

  d3.select('#tt-weight').html(d.data.weight);
  d3.select('#tt-weightSource').html(d.data.weightSource);
  d3.select('#tt-footprint').html(d.data.footprint);
  d3.select('#tt-protocol').html(d.data.protocol);

  // Show tooltip
  tooltip.transition()
          .duration(250)
          .style('opacity', .9);
  // Dynamically set tooltip position for best fit
  tooltip.style('left', function() {
    if (d3.event.offsetX > width / 2) {
      return d3.event.pageX - ttWidth - 10 + 'px';
    }
    return d3.event.pageX + 10 + 'px';
  })
  .style('top', function() {
    if (d3.event.offsetY > height / 2) {
      return d3.event.pageY - tooltip.node().getBoundingClientRect().height - 10 + 'px';
    }
    return d3.event.pageY + 10 + 'px';
  });
}

function removeToolTip(d) {
  // Confirm we moused out and not just to a new bar before hiding tooltip
  setTimeout(() => {
    if (d.data.id === lastMouseOver) {
      tooltip.transition()
          .duration(250)
          .style('opacity', 0);
    }
  }, 100);
}

function drawYAxis(updatedData) {
  // Move the axis back on top
  yAxis.node().parentNode.append(yAxis.node());
  yAxis.selectAll('g').remove();
  var yTick = yAxis.selectAll('g')
                  .data([0.1, 1, 10, 100, 300]);

  yTickEnter = yTick.enter().append('g');

  yTickEnter.append('circle')
              .attr('fill', 'none')
              .attr('stroke', '#000')
              .attr('r', y)

  yTickEnter.append('text')
              .attr('y', function(d) { return -y(d); })
              .attr('dy', '0.35em')
              .attr('fill', 'none')
              .attr('stroke', '#fff')
              .attr('stroke-width', 5)
              .text(y.tickFormat(5, '.1f'))

  yTickEnter.append('text')
              .attr('y', function(d) { return -y(d); })
              .attr('dy', '0.35em')
              .text(y.tickFormat(5, '.1f'));
}