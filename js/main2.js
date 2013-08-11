var barSpec = {spacing: 2, h: 20, fill: '#5777C0', moFill: '#A2B6E5'};
var chartSpec = {topMargin: 100, w: 600, label:{size: 12, color: "#000", moColor: "#474747"}};
//todo: replace with something dynamic
var svgTemp = {w: 1000};
var transitionSpeed = 500;

function loadData(){
	//fill list of DRGs
	d3.csv('./data/diagnoses.csv', function(error, csv){
		var dropDown = d3.select('#drgSelect');

		csv.unshift({code: "All", description: "All DRGs"});

		dropDown.selectAll('option')
		.data(csv).enter().append('option')
		.attr("value", function(d){ return d.code;})
		.text(function(d){return d.code + " - " + d.description;});
	});


	d3.csv('./data/national/DRG-All.csv', function(error, csv){
		var chartMain = d3.select("#chartMain")
		.attr({
			height: (csv.length * (barSpec.h + barSpec.spacing)) + 100, //todo this is messed up, why does the top margin need to be huge
			width: svgTemp.w
		});
		
		chartMain.append("g")
		.classed("barChart", true);

        chartMain.append("g")
        .classed("keyLabels", true);

		chartMain.call(drawChart, csv);
	});
}

function dropListChange(drgCode){
	//todo : more than just national
	d3.csv('./data/national/DRG-' + drgCode + '.csv', function(error, csv){
		d3.select("#chartMain").call(drawChart, csv);
	});
}

function drawChart(svg, data) {
    data.map(function(d){
        d.avgCoveredCharges = Number(d.avgCoveredCharges);
        d.averagePayments = Number(d.averagePayments);
    });

    var maxValue = d3.max(data, function(d){return d.avgCoveredCharges;});
    var avgValue = d3.mean(data, function(d){return d.avgCoveredCharges;});
    var xScale = d3.scale.linear().range([0, chartSpec.w]).domain([0, maxValue]);

	//chart encompasses the bars, bar value labels, and lines of the chart, everything that starts at value 0
	//the key labels are to the left of that so they do not count
	var chart = svg.selectAll("g.barChart").attr("transform", "translate(0, 30)");
    var keyLabels = svg.selectAll("g.keyLabels").attr("transform", "translate(0, 30)");

	var rects = chart.selectAll("rect.bar").data(data, function(d){return d.state;});
    var barValLabel = chart.selectAll("text.barValueLabel").data(data, function(d){return d.state;});
	var labels = keyLabels.selectAll("text.barLabel").data(data, function(d){return d.state;});

	//remove old data
	rects.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			width: 0
		}).remove();

	//just remove it, no need for fanciness
    barValLabel.exit().remove();

	labels.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			opacity: 0
		}).remove();

	//maxLine and avgLine are not removed, only added or updated

	//add/edit new labels - write them first as non visible to get the height and length, then position them based on their size
	var newLabels = labels.enter().append("text")
		.classed('barLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "middle",
          "text-anchor": "end",
          id : function(d,i){ return "lbl" + i;},
          "fill" : chartSpec.label.color,
          opacity: 0
        })
        .text(function(d){return d.state;});

	var chartStart = d3.max(labels[0], function(d){return d.getComputedTextLength();}) + 4;
        
    labels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
      x: chartStart - 4,
      y: function (d, i) {return (i * (barSpec.h + barSpec.spacing)) + (this.getBBox().height);}
    });
     
    newLabels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
		opacity: 1
    });

    //add/update rectangles
	rects.enter().append("rect")
		.classed('bar', true)
		.attr({
			x: chartStart,
			y: function(d,i){ return i*(barSpec.h + barSpec.spacing); },
			width: 0,
			height : barSpec.h,
			fill: barSpec.fill
		})        
        .on('mouseover', function(d, i){
          d3.select(this)
            .attr("fill", barSpec.moFill);

          d3.select("#lbl" + i)
            .attr("fill", chartSpec.label.moColor);
        })
        .on('mouseout', function(d, i){
          d3.select(this)
            .attr("fill", barSpec.fill);

           d3.select("#lbl" + i)
            .attr("fill", chartSpec.label.color);
        });

	//update data
	//grows the bar out to the width (inits to 0)
	rects.transition()
		.duration(transitionSpeed)
		.delay(transitionSpeed)
		.attr({
			y: function(d,i){ return i*(barSpec.h + barSpec.spacing); },
			width : function(d) { return xScale(d.avgCoveredCharges);}
		});

    //bar value labels
    barValLabel.enter()
        .append('text')
        .classed('barValueLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "middle",
          "text-anchor": "middle",
          id : function(d,i){ return "vLbl" + i;},
          "fill" : '#000',
          'opacity': 1,
          x: chartStart,
          y: function (d, i) {return (barSpec.h/2) + (i * (barSpec.h + barSpec.spacing)) + 1;}
        }).text("$0");

    barValLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), d.avgCoveredCharges);
            return function(t) {
                this.textContent = '$' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d, i) {return xScale(d.avgCoveredCharges) - 5;},
          y: function (d, i) {return (barSpec.h/2) + (i * (barSpec.h + barSpec.spacing)) + 1;}
        });

	//add/edit max and avg lines
	var avgLine = chart.selectAll("#avgLine").data([avgValue]);
    var avgLineLabel = svg.selectAll("#avgLineLabel").data([avgValue]);
    var maxLine = chart.selectAll("#maxLine").data([maxValue]);
    var maxLineLabel = svg.selectAll("#maxLineLabel").data([maxValue]);

    //avgLine add and update
    avgLine.enter().append("line")
      .attr({
        x1: chartStart,
        y1: 0,
        x2: chartStart,
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing,
        id: 'avgLine',
        opacity: 1
      })
      .style({
        stroke: "#F3AF00",
        'stroke-width': 1,
        'stroke-dasharray': ("6, 5")
      });

    avgLine.transition().duration(transitionSpeed).delay(transitionSpeed)
      .attr({
        x1: function(d){return chartStart + xScale(d);},
        y1: 0,
        x2: function(d){return chartStart + xScale(d);},
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing 
      });

    avgLine.moveToFront();

    //avgLineLabel add and update
    avgLineLabel.enter().append("text")
        .attr({
            x: chartStart,
            y:  20,
            id: "avgLineLabel"
        })
        .text("$0");

    avgLineLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), avgValue);
            return function(t) {
                this.textContent = 'Average: $' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d, i) {return xScale(avgValue);}
        });

    //maxLine add and update
    maxLine.enter().append("line")
      .attr({
        x1: chartStart,
        y1: 0,
        x2: chartStart,
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing,
        id: 'maxLine',
        opacity: 1
      })
      .style({
        stroke: "#000000",
        'stroke-width': 1
      });

    maxLine.transition().duration(transitionSpeed).delay(transitionSpeed)
      .attr({
        x1: function(d){return chartStart + xScale(d);},
        y1: 0,
        x2: function(d){return chartStart + xScale(d);},
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing 
      });

    //maxLineLabel add and update
    maxLineLabel.enter().append("text")
        .attr({
            x: chartStart,
            y:  20,
            id: "maxLineLabel"
        })
        .text("$0");

    maxLineLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), maxValue);
            return function(t) {
                this.textContent = 'Max: $' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d, i) {return xScale(maxValue);}
        });
   
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function commaSeparateNumber(val){
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}