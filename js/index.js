// Modified from https://bl.ocks.org/mbostock/6fead6d1378d6df5ae77bb6a719afcb2
var data = [];
var categories = ["Stage data not available", "Downstream", "Manufacturing", "Upstream"];
var x, y, z, g; // x scale, y scale, z scale, and svg group

d3.json('https://sheets.googleapis.com/v4/spreadsheets/1FKNZgxGHjQt9tQ-qmrst1TwK67FgAh7blCL1o-te_3Y/values/A:Z?key=AIzaSyA-F8PTqmCvmlWUPmKo8mVMS2siV7kIpZw', init);

function init(error, sourceData) {
  if (error) {
    return alert('Something went wrong, please try again later.');
  }

  cleanAndParseData(sourceData);

  var svg = d3.select("#chart"),
    width = + svg.attr("width"),
    height = + svg.attr("height"),
    innerRadius = 180,
    outerRadius = Math.min(width, height) / 2,
    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var x = d3.scaleBand()
            .range([0, 2 * Math.PI])
            .align(0);

  var y = d3.scaleRadial()
            .range([innerRadius, outerRadius]);

  var z = d3.scaleOrdinal()
            .range(["#686667", "#949fbd", "#755270", "#fd8d00"]);

  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.footprint; })]);
  z.domain(categories);
  g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(categories)(data))
    .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
    .selectAll("path")
    .data(function(d) { return d; })
    .enter().append("path")
      .attr("d", d3.arc()
          .innerRadius(function(d) { return y(d[0]); })
          .outerRadius(function(d) { return y(d[1]); })
          .startAngle(function(d) { return x(d.data.name); })
          .endAngle(function(d) { return x(d.data.name) + x.bandwidth(); })
          .padAngle(0.01)
          .padRadius(innerRadius)
      );

  // Place holder for the delta circles
  // var label = g.append("g")
  //   .selectAll("g")
  //   .data(data)
  //   .enter().append("g")
  //     .attr("text-anchor", "middle")
  //     .attr("transform", function(d) { return "rotate(" + ((x(d.State) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; });
  // label.append("text")
  //     .attr("transform", function(d) { return (x(d.State) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
  //     .text(function(d) { return d.State; });

  var yAxis = g.append("g")
      .attr("text-anchor", "middle");

  var yTick = yAxis
    .selectAll("g")
    .data(y.ticks(5).slice(1))
    .enter().append("g");

  yTick.append("circle")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("r", y);

  yTick.append("text")
      .attr("y", function(d) { return -y(d); })
      .attr("dy", "0.35em")
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 5)
      .text(y.tickFormat(5, "s"));

  yTick.append("text")
      .attr("y", function(d) { return -y(d); })
      .attr("dy", "0.35em")
      .text(y.tickFormat(5, "s"));

  yAxis.append("text")
      .attr("y", function(d) { return -y(y.ticks(5).pop()); })
      .attr("dy", "-1em")
      .text("Carbon Intensity");
}


function cleanAndParseData(sourceData) {
  sourceData = sourceData.values;
  sourceData.shift(); // Discard copyright notice
  let cols = sourceData.shift();
  let colIndexes = {
    name: cols.indexOf("Product name"),
    footprint: cols.indexOf("Product CO2e footprint (kg CO2e)"),
    upstream: cols.indexOf("CoClear-Footprint %Upstream"),
    operation: cols.indexOf("CoClear-Footprint %Operation"),
    downstream: cols.indexOf("CoClear-Footprint %Downstream"),
    transportation: cols.indexOf("CoClear-Footprint %Transportion"),
    endOfLife: cols.indexOf("CoClear-Footprint %EndOfLife"),
    industry: cols.indexOf("CoClear-Sector Mapping"),
    year: cols.indexOf("Year of reporting"),
  }

  // Normally we'd use the spread operator with a push and map, but keeping this ES5 for now
  sourceData = sourceData.filter((row) => row[colIndexes.industry] === 'Chemicals'); //Temp for testing
  sourceData.forEach(function(row) {
    data.push(mapRow(colIndexes, row));
  });
}

function mapRow(colIndexes, row) {
  let obj = {
    name: row[colIndexes.name],
    industry: row[colIndexes.industry],
    year: parseInt(row[colIndexes.year]),
    footprint: parseFloat(row[colIndexes.footprint]),
  };
  obj["Upstream"]                 = (parseFloat(row[colIndexes.upstream]) || 0 / 100) * obj.footprint;
  obj["Manufacturing"]            = (parseFloat(row[colIndexes.operation]) || 0 / 100) * obj.footprint;
  obj["Downstream"]               = (parseFloat(row[colIndexes.downstream]) || 0 / 100) * obj.footprint;
  obj["Stage data not available"] = (obj["Upstream"] + obj["Manufacturing"] + obj["Downstream"]) === 0 ? obj.footprint : 0;
  return obj;
}
