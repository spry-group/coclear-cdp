var categories = ['stage data not available', 'downstream', 'manufacturing', 'upstream'],
    svg,
    width,
    height,
    innerRadius = 150,
    outerRadius,
    tooltip,
    ttWidth,
    ttOffset,
    g, // Svg group
    x, // x scale (companies)
    y, // y scale (carbon intensity)
    z, // z scale (categories)
    yAxis,
    chartTitle,
    lastID,
    lastStage;


function createChart(data) {
  svg = d3.select('#chart');
  width = + svg.attr('width');
  height = + svg.attr('height');
  outerRadius = Math.min(width, height) / 2 - 25;
  tooltip = d3.select('#tooltip');
  ttWidth = + tooltip.attr('width');
  ttHeight = + tooltip.attr('height');
  ttOffset = document.getElementById('chart').getBoundingClientRect().x + ((width-ttWidth) / 2);

  g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  g.append('g')
   .attr('class', 'deltaCircles')

  x = d3.scaleBand()
          .range([0, 2 * Math.PI])
          .align(0);

  y = d3.scaleRadial()
          .range([innerRadius, outerRadius])

  z = d3.scaleOrdinal()
          .range(['#686667', '#00bff5', '#b8bfc9', '#ff8b00'])
          .domain(categories);

  yAxis = g.append('g')
           .attr('text-anchor', 'middle')
           .attr('class', 'yAxis');

  chartTitle = g.append('g')
                .attr('class', 'title');

  chartTitle.append('text')
              .text('Carbon Intensity')
              .attr('dy', '-' + (width / 2 - 12) + 'px')
              .attr('dx', '-64px')
              .attr('font-size', '1.5em')
              .attr('font-weight', '700')
              .attr('fill', 'none')
              .attr('stroke', '#fff')
              .attr('stroke-width', 10);

  chartTitle.append('text')
      .text('Carbon Intensity')
      .attr('dy', '-' + (width / 2 - 12) + 'px')
      .attr('dx', '-64px')
      .attr('font-size', '1.5em')
      .attr('font-weight', '700');

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
                      .attr('class', 'arc')
                      .attr('stage', function(d) { return d.key })
                      .on('mouseover', function(d) { lastStage = d.key });

  let paths = arcsEnter.merge(arcs)
                       .attr('fill', function(d) { return z(d.key); })
                       .selectAll('path')
                       .data(transformToPercent);
  paths.exit().remove();

  let pathsEnter = paths.enter().append('path');

  pathsEnter.merge(paths)
            .attr('d', d3.arc()
              .innerRadius(function(d) { return d[0]; })
              .outerRadius(function(d) { return d[1]; })
              .startAngle(function(d) { return x(d.data.id); })
                                      // cap band width to ensure it doesn't look like a pie chart
              .endAngle(function(d) { return x(d.data.id) + (x.bandwidth() < 0.21 ? x.bandwidth() : 0.21); })
              .padAngle(0.01)
              .padRadius(innerRadius)
            ).on('mouseover', showToolTip)
             .on('mouseleave', removeToolTip);

  // Delta circles
  let circleRadius = innerRadius / updatedData.length * 0.75;
      circleRadius = circleRadius < 1.7 ? 1.7 : circleRadius;
      circleRadius = circleRadius > 15  ? 15  : circleRadius;

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
                                      let bandwidth = x.bandwidth() < 0.21 ? x.bandwidth() : 0.21;
                                      return 'rotate(' + (
                                        ((x(d.id) + bandwidth / 2) * 180) / Math.PI - 90
                                      ) + ') translate(' + (innerRadius - circleRadius * 2.5) + ', 0)';
                                   });
  circles.exit().remove();

  drawYAxis(updatedData);
}

function showToolTip(d) {
  lastID = d.data.id;

  // Update tooltip data
  d3.select('#tt-topline').html(d.data.company + ' &vert; ' + d.data.country + ' &vert; ' + d.data.sector);
  d3.select('#tt-year').html(d.data.year);
  d3.select('#tt-name').html(d.data.name);
  d3.select('#tt-desc').html(d.data.desc);
  d3.select('#tt-footprintChange').html(getFootprintChangeMessage(d));

  d3.select('#tt-footprint').html(d.data.footprintLabel);
  d3.select('#tt-carbonInt').html(d.data.carbonIntLabel);
  d3.select('#tt-weight').html(d.data.weight);
  d3.select('#tt-coclearId').html(d.data.coclearId);

  d3.select('#tt-upstreamPer').html(d.data.upstreamPer || 'Not reported');
  d3.select('#tt-manufacturingPer').html(d.data.manufacturingPer || 'Not reported');
  d3.select('#tt-downstreamPer').html(d.data.downstreamPer || 'Not reported');

  d3.select('#tt-weightSource').html(d.data.weightSource);
  d3.select('#tt-protocol').html(d.data.protocol);
  d3.select('#tt-dataCorrections').html(d.data.dataCorrections === 'n/a' ? 'None' : d.data.dataCorrections);

  // Show tooltip
  tooltip.transition()
          .duration(250)
          .style('opacity', .95);
  // Dynamically set tooltip position for best fit
  tooltip.style('left', function() {
    return ttOffset + 'px';
  })
  .style('top', function() {
    // Try to put tooltip above or below the mouse.
    let ttTop = d3.event.offsetY > height / 2 ? d3.event.pageY - tooltip.node().getBoundingClientRect().height - 10 :
                                                d3.event.pageY + 10;
    // Ensure the tooltip is always fully on screen
    return ttForceOnScreen(ttTop) + 'px';
  });
}

function ttForceOnScreen(ttTop) {
    let boundingBox = tooltip.node().getBoundingClientRect();
    let viewportHeight = (window.innerHeight || document.documentElement.clientHeight);
    let scrollTop = window.pageYOffset ||
                    (document.documentElement || document.body.parentNode || document.body).scrollTop;

    if (ttTop < scrollTop) {
      // Too high
      return scrollTop + 10;
    } else if (ttTop + boundingBox.height > scrollTop + viewportHeight) {
      // Too low
      return scrollTop + viewportHeight - boundingBox.height - 10;
    }
    return ttTop;
}

function getFootprintChangeMessage(d) {
  if (!d.data.footprintChangePer) {
    if (d.data.footprintChangeCategory === 'N/a (no %change reported)') {
      return d.data.company + ' did not yet report a change in emissions for this product.';
    }
    return 'N/a (first time ' + d.data.company + ' reported on this product).';
  }

  let deltaText = (d.data.footprintChangePer > 0 ?
    '<span class="increase">' + d.data.footprintChangePerLabel + ' increase</span>' :
    '<span class="decrease">' + d.data.footprintChangePerLabel + ' decrease</span>');

  if (d.data.footprintChangeCategory === 'No specific reason reported') {
    return d.data.company + ' did not report a reason for the ' + deltaText + ' in product emissions';
  }

  return d.data.company + ' reported a ' + deltaText + ' in product emissions, with the following explanation: ' +
    d.data.footprintChangeReason;
}

function removeToolTip(d) {
  // Confirm we moused out and not just to a new bar before hiding tooltip
  setTimeout(() => {
    if (d.data.id === lastID && lastStage === this.parentElement.getAttribute('stage')) {
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
                  .data([0.1, 1, 10, 100, 300, 500]);

  yTickEnter = yTick.enter().append('g');

  yTickEnter.append('circle')
              .attr('fill', 'none')
              .attr('stroke', '#000')
              .attr('r', y)

  // Mask background
  yTickEnter.append('text')
              .attr('y', function(d) { return -y(d); })
              .attr('dy', '0.35em')
              .attr('fill', 'none')
              .attr('stroke', '#fff')
              .attr('stroke-width', 4)
              .text(y.tickFormat(5, '.1f'))

  yTickEnter.append('text')
              .attr('y', function(d) { return -y(d); })
              .attr('dy', '0.35em')
              .text(y.tickFormat(5, '.1f'));

  // Move chart title back on top
  chartTitle.node().parentNode.append(chartTitle.node());
}

// Accurately display breakdown of bar arcs by percent, instead of the exponential scale.
function transformToPercent(d) {
  d.forEach(datum => {
    let downstream = parseFloat(datum.data.downstreamPer);
    let manufacturing = parseFloat(datum.data.manufacturingPer);
    let upstream = parseFloat(datum.data.upstreamPer);
    let start = getStartingPercent(d.key, downstream, manufacturing);
    let end = getEndingPercent(d.key, downstream, manufacturing, upstream);

    if (d.key === 'stage data not available') {
      datum[0] = y(0);
      datum[1] = datum.data[d.key] > 0 ? y(datum.data[d.key]) : y(0);
      return;
    }

    datum[0] = getPixels(start, datum);
    datum[1] = getPixels(end, datum);
  });
  return d;
}

function getStartingPercent(key, downstream, manufacturing) {
  return key === 'downstream'     ? 0 :
         key === 'manufacturing'  ? downstream :
                                    downstream + manufacturing;
}

function getEndingPercent(key, downstream, manufacturing, upstream) {
  return key === 'downstream'     ? downstream :
         key === 'manufacturing'  ? downstream + manufacturing :
         key === 'upstream'       ? downstream + manufacturing + upstream :
                                    0;
}

function getPixels(percent, datum) {
  // We want to break the bars into a percentages on a linear scale instead of an exponential one
  // To do this we calculate absolute pixel values, and need to offset the inner radius
  let pixels = percent / 100 * (y(datum.data.carbonInt) - y(0));
  return pixels + y(0);
}
