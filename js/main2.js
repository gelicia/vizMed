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

	var bars = chart.selectAll("g.bar").data(data, function(d){return d.state;});
	var labels = svg.selectAll("text.barLabel").data(data, function(d){return d.state;});

	var xScale = d3.scale.linear()
		.domain([0, d3.max(data, function(d){return d.avgCoveredCharges;})])
		.range([0, chartSpec.w]); 

	//remove old data
	bars.exit().selectAll("rect")
		.transition()
		.duration(transitionSpeed)
		.attr({
			width: 0
		}).remove();

	bars.exit().selectAll("text").remove();

	labels.exit().remove();

	//add new data
	bars.enter().append("g")
	.classed("bar", true)
	.attr({
		transform: function(d, i){ return 'translate(0, '+(i*(barSpec.h + barSpec.spacing))+')'; }
	})
	.append("rect")
		.attr({
			x: 0,
			y: 0,
			width: function(d){ return xScale(d.avgCoveredCharges);},
			height : barSpec.h,
			fill: barSpec.fill
		});

	labels.enter().append("text")
	.classed("barLabel", true)
	.text(function(d){return d.state;});
}