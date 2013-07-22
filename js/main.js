//how the bar chart will look
var barSpec = {spacing: 2, h: 20, fill: '#5777C0', moFill: '#A2B6E5'};
//total margin all around the sides
var margin = {t: 20, b: 10, l: 10, r: 10};
//range for the chart
var chartSpec = {topMargin: 100, w: 600, label:{size: 12, color: "#000", moColor: "#474747"}};
//todo: replace with something dynamic
var svgTemp = {w: 1000, h: 5000};

function loadData(){
  var svg = d3.select("svg#chartMain");

  d3.csv('./data/national/DRG-All.csv', 
    function(error, csv) {
      svg.attr({
        height: (csv.length * (barSpec.h + barSpec.spacing)) + chartSpec.topMargin
      });

      //do the labels first, the chart's g will depend on the largest w
      var labelG = svg.append('g')
        .classed('labels', true)
        .attr("transform", "translate(" + margin.l + "," + chartSpec.topMargin + ")");

      var labels = labelG.selectAll('text.barLabel')
        .data(csv)
        .enter()
        .append('text')
        .classed('barLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "end",
          "text-anchor": "end",
          id : function(d,i){ return "lbl" + i;},
          "fill" : chartSpec.label.color
        })
        .text(function(d){return d.state;});

        labelG.selectAll('text.barLabel')
        .attr({
          y: function (d, i) {return (i * (barSpec.h + barSpec.spacing)) + (this.getBBox().height);}
        });

      //once the labels are made, calculate the longest label and add spacing to get where the bars should start
      var chartStart = d3.max(labels[0], function(d){return d.getComputedTextLength();}) + 4;
      var valMax = d3.max(csv, function(d){return d.avgCoveredCharges;});

      d3.selectAll("text.barLabel")
      .attr("x", chartStart - 4);

      var x = d3.scale.linear()
        .domain([0, valMax])
        .range([0, chartSpec.w]);

      var bars = svg.append('g')
        .classed('barChart', true)
        .attr("transform", "translate(" + (margin.l + chartStart) + "," + chartSpec.topMargin + ")");

      bars.selectAll('rect.bar')
        .data(csv)
        .enter()
        .append('rect')
        .classed('bar', true)
        .attr({
          x: 0,
          y: function(d,i){return i * (barSpec.h + barSpec.spacing);},
          height: barSpec.h,
          width: function(d){return x(d.avgCoveredCharges);},
          fill: barSpec.fill,
          id: function(d, i){ return "bar" + i;}
        })
        .on('mouseover', function(d, i){
          d3.select("#bar" + i)
            .attr("fill", barSpec.moFill);

          d3.select("#lbl" + i)
            .attr("fill", chartSpec.label.moColor);
        })
        .on('mouseout', function(d, i){
          d3.select("#bar" + i)
            .attr("fill", barSpec.fill);

           d3.select("#lbl" + i)
            .attr("fill", chartSpec.label.color);
        });

      //bar value label
      bars.selectAll("text.barValueLabel")
        .data(csv)
        .enter()
        .append('text')
        .classed('barValueLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "end",
          "text-anchor": "end",
          id : function(d,i){ return "lbl" + i;},
          "fill" : '#000'
        })
        .text(function(d){return '$' + commaSeparateNumber(d.avgCoveredCharges);});

        bars.selectAll('text.barValueLabel')
        .attr({
          x: function (d, i) {return x(d.avgCoveredCharges) - 2;},
          y: function (d, i) {return (i * (barSpec.h + barSpec.spacing)) + (this.getBBox().height) + 1;}
        });

      //the baseline is drawn after so it is over the bars
      bars.append('line')
        .attr({
          x1:0,
          x2:0,
          y1:0,
          y2: (csv.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing
        })
        .style("stroke", "#000")
        .classed("baseLine", true);

      //average line
      var avg = d3.mean(csv, function(d){return d.avgCoveredCharges;});
console.log(avg);
      bars.append("line")
      .attr({
        x1: x(avg),
        y1: 0  ,
        x2: x(avg),
        y2: (csv.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing ,
        "id" : 'avgLine',
        'opacity': 1
      })
      .style({
        stroke: "#F3AF00",
        'stroke-width': 1,
        'stroke-dasharray': ("6, 5")
      });

      bars.append("text")
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "end",
          "text-anchor": "middle",
          id : 'avgLineLabel',
          "fill" : '#000',
          x: x(avg),
          y: -5
        })
        .text('$' + commaSeparateNumber(Math.round(avg)));

      //max line
      bars.append("line")
      .attr({
        x1: x(valMax),
        y1: 0  ,
        x2: x(valMax),
        y2: (csv.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing ,
        "id" : 'avgLine',
        'opacity': 1
      })
      .style({
        stroke: "#000",
        'stroke-width': 1
      });

      bars.append("text")
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "end",
          "text-anchor": "middle",
          id : 'maxLineLabel',
          "fill" : '#000',
          x: x(valMax),
          y: -5
        })
        .text('$' + commaSeparateNumber(Math.round(valMax)));
    });
}

function drillDown(){}

function buildUp(){}

  function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
  }