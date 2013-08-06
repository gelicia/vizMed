var barSpec = {spacing: 2, h: 20, fill: '#5777C0', moFill: '#A2B6E5'};
var chartSpec = {topMargin: 30, w: 600, label:{size: 12, color: "#000", moColor: "#474747"}};
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
			height: (csv.length * (barSpec.h + barSpec.spacing)),
			width: svgTemp.w
		});
		
		chartMain.append("g")
		.classed("barChart", true);

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
	//chart encompasses the bars, bar value labels, and lines of the chart, everything that starts at value 0
	//the key labels are to the left of that so they do not count
	var chart = svg.selectAll("g.barChart");

	var rects = chart.selectAll("rect.bar").data(data, function(d){return d.state;});
	var labels = svg.selectAll("text.barLabel").data(data, function(d){return d.state;});
	console.log(d3.max(data, function(d){return d.avgCoveredCharges;}));
	var xScale = d3.scale.linear()
		.domain([0, d3.max(data, function(d){return d.avgCoveredCharges;})])
		.range([0, chartSpec.w]); 

	//remove old data
	rects.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			width: 0
		}).remove();

	//todo remove bar value text

	labels.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			opacity: 0
		}).remove();

	//add new labels - write them first as non visible to get the height and length, then position them based on their size
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

	var chartStart = d3.max(labels[0], function(d){return d.getComputedTextLength();});
        
    labels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
      x: chartStart,
      y: function (d, i) {return (i * (barSpec.h + barSpec.spacing)) + (this.getBBox().height);}
    });
     
    newLabels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
		opacity: 1
    });

	rects.enter().append("rect")
		.classed('bar', true)
		.attr({
			x: chartStart + 4,
			y: function(d,i){ return i*(barSpec.h + barSpec.spacing); },
			width: 0,
			height : barSpec.h,
			fill: barSpec.fill
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
}