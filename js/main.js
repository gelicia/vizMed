var barSpec = {spacing: 2, h: 20, fill: '#5777C0', moFill: '#A2B6E5'};
var chartSpec = {topMargin: 100, w: 600, insideOffset: 30, label:{size: 12, color: "#000", moColor: "#474747"}};
//todo: replace with something dynamic
var svgTemp = {w: 1000};
var transitionSpeed = 500;

var travelPath = ["USA"];

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

    //this can just be hardcoded, will always init at drg all 
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

function getFilePath(drgCode){
    var pathOut = './data/national/';

    switch (travelPath.length){
        case 1 : break; //national level
        case 2 : pathOut = pathOut + travelPath[1] + "/"; //state level
                 break;
        case 3 : pathOut = pathOut + travelPath[1] + "/" + travelPath[2] + "/"; //city level
                 break;
        case 4 : pathOut = pathOut + travelPath[1] + "/" + travelPath[2] + "/providers/" + travelPath[3] + "-DRGs.csv"; //provider level
                 break;
    }

    //fileName part - provider level does not seperate by DRG
    if(travelPath.length < 4){
        pathOut = pathOut + "DRG-" + drgCode + ".csv";
    }
    console.log("path: " + pathOut);
    return pathOut;
}

//this should handle all changes, since there isn't a lot of differences between them 
function redrawChart(drgCode, travelLevel){
    if (travelLevel !== undefined){
        travelPath.push(travelLevel);
    }
    
	d3.csv(getFilePath(drgCode), function(error, csv){
		d3.select("#chartMain").call(drawChart, csv);
	});
}

function drawChart(svg, data) {
    svg.attr("height", (data.length * (barSpec.spacing + barSpec.h)) + chartSpec.insideOffset);

    data.map(function(d){
        d.avgCoveredCharges = Number(d.avgCoveredCharges);
        d.averagePayments = Number(d.averagePayments);
    });

    var maxValue = d3.max(data, function(d){return d.avgCoveredCharges;});
    var avgValue = d3.mean(data, function(d){return d.avgCoveredCharges;});
    var xScale = d3.scale.linear().range([0, chartSpec.w]).domain([0, maxValue]);

    console.log(xScale(maxValue));

	//chart encompasses the bars, bar value labels, and lines of the chart, everything that starts at value 0
	//the key labels are to the left of that so they do not count
	var chart = svg.selectAll("g.barChart").attr("transform", "translate(0, " + chartSpec.insideOffset + ")");
    var keyLabels = svg.selectAll("g.keyLabels").attr("transform", "translate(0, " + chartSpec.insideOffset + ")");

    //this varies depending on where we are data-wise
    var keyName;

    switch (travelPath.length){
        case 1 : keyName = 'state'; break;
        case 2 : keyName = 'city'; break;
        case 3 : keyName = 'providerName'; break;
        case 4 : keyName = 'description'; break;
    }

	var rects = chart.selectAll("rect.bar").data(data, function(d){return d[keyName];});
    var barValLabel = chart.selectAll("text.barValueLabel").data(data, function(d){return d[keyName];});
	var labels = keyLabels.selectAll("text.barLabel").data(data, function(d){ return d[keyName];});

    //add/edit max and avg lines
    //if the two are the same, insert empty array so everything is removed
    var avgArr = maxValue == avgValue ? [] : [avgValue];
    var maxArr = maxValue == avgValue ? [] : [maxValue];
    var avgLine = chart.selectAll("#avgLine").data(avgArr);
    var avgLineLabel = svg.selectAll("#avgLineLabel").data(avgArr);
    var maxLine = chart.selectAll("#maxLine").data(maxArr);
    var maxLineLabel = svg.selectAll("#maxLineLabel").data(maxArr);

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

	//maxLine and avgLine do not show if maxValue and avgValue are the same (data is only one element)
    avgLine.exit().remove();
    avgLineLabel.exit().remove();
    maxLine.exit().remove();
    maxLineLabel.exit().remove();

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
        .text(function(d){return d[keyName];});

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
        })
        .on('click', function(d){
            redrawChart($("#drgSelect").children(':selected').val(), keyName == "providerName" ? d.providerNationalID : d[keyName]);
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
          "text-anchor": "end",
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
          x: function (d, i) {console.log(xScale(d.avgCoveredCharges)); return chartStart + xScale(d.avgCoveredCharges) - 5;},
          y: function (d, i) {return (barSpec.h/2) + (i * (barSpec.h + barSpec.spacing)) + 1;}
        });

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
            id: "avgLineLabel",
            'text-anchor' : "middle"
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
          x: function (d, i) {return chartStart + xScale(avgValue);}
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
            id: "maxLineLabel",
            'text-anchor' : "middle"
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
          x: function (d, i) {return chartStart + xScale(maxValue);}
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