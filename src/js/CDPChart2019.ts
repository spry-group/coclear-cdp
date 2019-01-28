import * as d3 from 'd3';
import { scaleRadial } from "./scale-radial";


export class CDPChart2019 {
  protected categories: any = ['stage data not available', 'downstream', 'manufacturing', 'upstream'];
  protected svg: any;
  protected width: number = 950;
  protected height: number = 950;
  protected innerRadius: number = 150;
  protected outerRadius: number  = Math.min(this.width, this.height) / 2 - 25;
  protected tooltip: any;
  protected g: any; // Svg group
  protected x: any; // x scale (companies)
  protected y: any; // y scale (carbon intensity)
  protected z: any; // z scale (categories)
  protected yAxis: any;
  protected chartTitle: any;
  protected lastID: any;
  protected lastStage: any;

  constructor(chartSelector: string, tooltipSelector: string) {
    this.svg = d3.select(chartSelector);
    this.tooltip = d3.select(tooltipSelector);

    this.svg.attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
      this.g = this.svg.append('g').attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');
      this.g.append('g')
       .attr('class', 'deltaCircles')

      this.x = d3.scaleBand()
              .range([0, 2 * Math.PI])
              .align(0);

      this.y = scaleRadial()
              .range([this.innerRadius, this.outerRadius])

      this.z = d3.scaleOrdinal()
              .range(['#686667', '#00bff5', '#b8bfc9', '#ff8b00'])
              .domain(this.categories);

      this.yAxis = this.g.append('g')
               .attr('text-anchor', 'middle')
               .attr('class', 'yAxis');

      this.chartTitle = this.g.append('g')
                    .attr('class', 'title');

      this.chartTitle.append('text')
                  .text('Carbon Intensity')
                  .attr('dy', '-' + (this.width / 2 - 12) + 'px')
                  .attr('dx', '-64px')
                  .attr('font-size', '1.5em')
                  .attr('font-weight', '700')
                  .attr('fill', 'none')
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 10);

      this.chartTitle.append('text')
          .text('Carbon Intensity')
          .attr('dy', '-' + (this.width / 2 - 12) + 'px')
          .attr('dx', '-64px')
          .attr('font-size', '1.5em')
          .attr('font-weight', '700');
     this.svg.on('click', () => this.closeTTOnIpadAndMobile())
  }


    update(data: any) {
        this.x.domain(data.map((d: any) => d.id));
        this.y.domain([0, d3.max(data, (d: any) => d.carbonInt)]);

        // Bars
        var arcs = this.g.selectAll('.arc')
                    .data(d3.stack().keys(this.categories)(data));
        arcs.exit().remove();

        let arcsEnter = arcs.enter()
                            .append('g')
                            .attr('class', 'arc')
                            .attr('stage', (d: any) => d.key )
                            .on('mouseover', (d: any) => { this.lastStage = d.key });

        let paths = arcsEnter.merge(arcs)
                            .attr('fill', (d: any) =>  { return this.z(d.key); })
                            .selectAll('path')
                            .data((d: any) => this.transformToPercent(d));
        paths.exit().remove();

        let pathsEnter = paths.enter().append('path');

        pathsEnter.merge(paths)
                  .attr('d', d3.arc()
                              .innerRadius((d: any) => { return d[0]; })
                              .outerRadius((d: any) => { return d[1]; })
                              .startAngle((d: any ) => { return this.x(d.data.id); })
                                                      // cap band width to ensure it doesn't look like a pie chart
                              .endAngle((d:any) =>{ return this.x(d.data.id) + (this.x.bandwidth() < 0.21 ? this.x.bandwidth() : 0.21); })
                              .padAngle(0.01)
                              .padRadius(this.innerRadius))
                  .on('mouseover', (e: any) => this.showToolTip(e))
                  .on('mouseleave', (e: any, d: any) => this.hideToolTip());

        // Delta circles
        let circleRadius = this.innerRadius / data.length * 0.75;
            circleRadius = circleRadius < 1.7 ? 1.7 : circleRadius;
            circleRadius = circleRadius > 15  ? 15  : circleRadius;

        const emissionDeltas = this.g.select('.deltaCircles')
                              .selectAll('.emissionDelta')
                              .data(data.filter((d: any) => d.footprintChangePer));
        emissionDeltas.exit().remove();

        const emissionDeltasEnter = emissionDeltas.enter()
                                                .append('circle')
                                                .attr('class', 'emissionDelta')
        emissionDeltasEnter.exit().remove();

        let circles = emissionDeltasEnter.merge(emissionDeltas)
                                        .attr('fill', (d: any) => d.footprintChangePer <= 0 ? '#097625' : '#f32033')
                                        .attr('stroke', 'none')
                                        .attr('r', circleRadius)
                                        .attr('transform', (d: any) => {
                                            const bandwidth = this.x.bandwidth() < 0.21 ? this.x.bandwidth() : 0.21;
                                            const rotation = (this.x(d.id) + bandwidth / 2) * 180 / Math.PI - 90;
                                            const translation = this.innerRadius - circleRadius * 2.5;
                                            return `rotate(${rotation}) translate(${translation})`;
                                        });
        circles.exit().remove();

        this.drawYAxis(data);
    }

    closeTTOnIpadAndMobile() {
      if (document.documentElement.clientWidth < 1280 && this.tooltip.style('opacity') === '1' ) {
        this.hideToolTip()
      }
    }

    showToolTip(d: any) {
      this.lastID = d.data.id;
      // Update tooltip data
      d3.select('#tt-topline').html(d.data.company + ' &vert; ' + d.data.country + ' &vert; ' + d.data.sector);
      d3.select('#tt-year').html(d.data.year);
      d3.select('#tt-name').html(d.data.name);
      d3.select('#tt-desc').html(d.data.desc);
      d3.select('#tt-footprintChange').html(() => this.getFootprintChangeMessage(d));

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
      this.tooltip.transition()
              .duration(250)
              .style('opacity', .95);
      // Dynamically set tooltip position for best fit
      this.tooltip.style('top', () =>  {
        // Try to put tooltip above or below the mouse.
        let ttTop = d3.event.offsetY > this.height / 2
                      ? d3.event.pageY - this.tooltip.node().getBoundingClientRect().height - 10
                      : d3.event.pageY + 10;
        // Ensure the tooltip is always fully on screen
        return this.ttForceOnScreen(ttTop) + 'px';
      });
    }

    ttForceOnScreen(ttTop: number) {
        let boundingBox = this.tooltip.node().getBoundingClientRect();
        let viewportHeight = (window.innerHeight || document.documentElement.clientHeight);
        let scrollTop = window.pageYOffset ||
                        (document.documentElement || document.body.parentElement || document.body).scrollTop;

        if (ttTop < scrollTop) {
          // Too high
          return scrollTop + 10;
        } else if (ttTop + boundingBox.height > scrollTop + viewportHeight) {
          // Too low
          return scrollTop + viewportHeight - boundingBox.height - 10;
        }
        return ttTop;
    }

    getFootprintChangeMessage(d: any) {
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

    hideToolTip() {
      this.tooltip.transition().duration(250).style('opacity', 0);
    }

    drawYAxis(data:any) {
      // Move the axis back on top
      this.yAxis.node().parentNode.append(this.yAxis.node());
      this.yAxis.selectAll('g').remove();
      var yTick = this.yAxis.selectAll('g').data([0.1, 1, 10, 100, 300, 500]);
      let yTickEnter = yTick.enter().append('g');

      yTickEnter.append('circle')
                  .attr('fill', 'none')
                  .attr('stroke', '#999')
                  .attr('class', 'y-tick')
                  .attr('r', this.y)

      // Mask background
      yTickEnter.append('text')
                  .attr('y', (d:number) => -this.y(d))
                  .attr('dy', '0.35em')
                  .attr('fill', 'none')
                  .attr('stroke', '#fff')
                  .attr('stroke-width', 4)
                  .text(this.y.tickFormat(5, '.1f'))

      yTickEnter.append('text')
                  .attr('y', (d: number) => -this.y(d))
                  .attr('dy', '0.35em')
                  .text(this.y.tickFormat(5, '.1f'));

      // Move chart title back on top
      this.chartTitle.node().parentNode.append(this.chartTitle.node());
    }

    // Accurately display breakdown of bar arcs by percent, instead of the exponential scale.
    transformToPercent(d: any) {
      d.forEach((datum: any) => {
        let downstream = parseFloat(datum.data.downstreamPer);
        let manufacturing = parseFloat(datum.data.manufacturingPer);
        let upstream = parseFloat(datum.data.upstreamPer);
        let start = this.getStartingPercent(d.key, downstream, manufacturing);
        let end = this.getEndingPercent(d.key, downstream, manufacturing, upstream);

        if (d.key === 'stage data not available') {
          datum[0] = this.y(0);
          datum[1] = datum.data[d.key] > 0 ? this.y(datum.data[d.key]) : this.y(0);
          return;
        }

        datum[0] = this.getPixels(start, datum);
        datum[1] = this.getPixels(end, datum);
      });
      return d;
    }

    getStartingPercent(key: any, downstream: any, manufacturing: any) {
      return key === 'downstream'     ? 0 :
            key === 'manufacturing'  ? downstream :
                                        downstream + manufacturing;
    }

    getEndingPercent(key: any, downstream: any, manufacturing: any, upstream: any) {
      return key === 'downstream'     ? downstream :
            key === 'manufacturing'  ? downstream + manufacturing :
            key === 'upstream'       ? downstream + manufacturing + upstream :
                                        0;
    }

    getPixels(percent: any, datum: any) {
      // We want to break the bars into a percentages on a linear scale instead of an exponential one
      // To do this we calculate absolute pixel values, and need to offset the inner radius
      let pixels = percent / 100 * (this.y(datum.data.carbonInt) - this.y(0));
      return pixels + this.y(0);
    }

}
