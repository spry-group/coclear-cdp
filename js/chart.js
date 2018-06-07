var categories = ['stage data not available', 'downstream', 'manufacturing', 'upstream'],
    svg,
    width,
    height,
    innerRadius = 180,
    outerRadius,
    tooltip,
    ttWidth,
    g, // Svg group
    x, // x scale (companies)
    y, // y scale (footprint)
    z, // z scale (categories)
    yAxis;


function createChart(data) {
  svg = d3.select('#chart');
  width = + svg.attr('width');
  height = + svg.attr('height');
  outerRadius = Math.min(width, height) / 2;
  tooltip = d3.select('#tooltip');
  ttWidth = + tooltip.attr('width');

  g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

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
  x.domain(updatedData.map(function(d) { return d.name; }));
  y.domain([0, d3.max(updatedData, function(d) { return d.footprint; })]);

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
              .startAngle(function(d) { return x(d.data.name); })
              .endAngle(function(d) { return x(d.data.name) + x.bandwidth(); })
              .padAngle(0.01)
              .padRadius(innerRadius)
            ).on('mouseover', showToolTip);

  drawYAxis(yAxis);
}

function showToolTip(d) {
  // Update tooltip data
  d3.select('#tt-company').html(d.data.company);
  d3.select('#tt-name').html(d.data.name);
  d3.select('#tt-desc').html(d.data.desc);

  d3.select('#tt-footprintChangePer').html(d.data.footprintChangePer);
  d3.select('#tt-footprintChangeReason').html(d.data.footprintChangeReason);

  d3.select('#tt-carbonInt').html(d.data.carbonInt);
  d3.select('#tt-upstreamPer').html(d.data.upstreamPer);
  d3.select('#tt-manufacturingPer').html(d.data.manufacturingPer);
  d3.select('#tt-downstreamPer').html(d.data.downstreamPer);

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

function drawYAxis() {
  // Move the axis back on top
  yAxis.node().parentNode.append(yAxis.node());

  yAxis.selectAll('g').remove();
  var yTick = yAxis.selectAll('g')
                   .data(y.ticks(5).slice(1));

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
              .text(y.tickFormat(5, 's'))

  yTickEnter.append('text')
              .attr('y', function(d) { return -y(d); })
              .attr('dy', '0.35em')
              .text(y.tickFormat(5, 's'));
}