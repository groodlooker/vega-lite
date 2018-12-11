//add the concept of "adding to detail" to support something like a barbell chart?

looker.plugins.visualizations.add({
    create: function(element, config){

        container = element.appendChild(document.createElement("div"));
        container.setAttribute("id","my-vega");

    },
    updateAsync: function(data, element, config, queryResponse, details, doneRendering){

      var myData = [];
      var dataProperties = {};
      var dims = [];
      var meas = [];
      var allFields = [];

      var options = createOptions(queryResponse)['options'];

      console.log(queryResponse);  

      this.trigger('registerOptions', options);  

      if (Object.keys(config).length > 2) {

      var chartWidth = document.getElementById("my-vega").offsetWidth * 0.81;
      var chartHeight = document.getElementById("my-vega").offsetHeight;
      var parent = document.getElementById("my-vega").parentElement;
      var chartHeight = parent.offsetHeight * 0.78;

      for (var cell in data) {
        var obj = data[cell];
        var dataDict = {};
        dataDict['links'] = [];
        for (var key in obj){
          var shortName = key.replace(".","?");
          dataDict[shortName] = obj[key]['value'];
          if (typeof obj[key]['links'] != "undefined") {

            //create array of all links for a row of data
            for(var l=0;l<obj[key]['links'].length;l++){

              //grab link label and add field name for clarity in menu
              var currentLabel = obj[key]['links'][l]['label'];
              currentLabel = currentLabel + " (" + shortName.substring(shortName.indexOf("?")+1) + ")";
              obj[key]['links'][l]['label'] = currentLabel;
            }
            //add links for field in row
            dataDict['links'].push(obj[key]['links']);
          }
        }
        //flatten to make single depth array
        dataDict['links'] = dataDict['links'].flat();
        myData.push(dataDict);
      }

      var rowValues = [];
      var colValues = [];

      //auto-size settings when a row facet included
      if (typeof config['row'] != "undefined" && typeof config['row'] != "" && config['fixed_height'] == null) {
        for (var x = 0; x < myData.length; x++) {
          rowValues.push(myData[x][config['row']]);
        }
        let uniqueRows = new Set(rowValues); 
        chartHeight = Math.max( (chartHeight / uniqueRows.size), (chartHeight / 12) );       
      }

      //auto-sizing settings when a column facet included
      if (typeof config['column'] != "undefined" && config['column'] != "" && config['fixed_width'] == null) {
        for (var x = 0; x < myData.length; x++) {
          colValues.push(myData[x][config['column']]);
        }
        let uniqueCols = new Set(colValues); 
        chartWidth = Math.max( (chartWidth / uniqueCols.size), (chartWidth / 12) ) ;       
      }

      //manual-sizing for chart height
      if (typeof config['fixed_height'] != "undefined" && config['fixed_height'] != null) {
        chartHeight = config['fixed_height'];
      }

      //manual-sizing for chart width
      if (typeof config['fixed_width'] != "undefined" && config['fixed_width'] != null) {
        chartWidth = config['fixed_width'];
      }      

      //create array of all measures for lookup purposes
      queryResponse.fields.measure_like.forEach(function(field){
        var fieldName = (field.name).replace(".","?");
        meas.push(fieldName);      
      });
      //create array of all dimensions for lookup purposes
      queryResponse.fields.dimension_like.forEach(function(field){
        var fieldName = (field.name).replace(".","?");
        dims.push(fieldName);      
      });

      allFields = meas.concat(dims);

      var dataFormatDict = {
        "$#,##0" : "$,.0f",
        "$#,##0.00" : "$,.2f",
        "#,##0.00%" : ",.2%",
        "#,##0.0%" : ",.1%",
        "#,##0%" : ",.0%",
        "null" : ""
      };

      //determine number format
      for (var field in allFields) {
        var lookerName = allFields[field].replace("?",".");
        dataProperties[allFields[field]] = {};
        //get friendly names for measures
        queryResponse.fields.measure_like.forEach(function(measure){
          if (lookerName == measure['name']) {
            //get label short or label to handle table calcs
            if (typeof measure['label_short'] != "undefined") {
              dataProperties[allFields[field]]['title'] = measure['label_short'];
            } else {
              dataProperties[allFields[field]]['title'] = measure['label'];
            }
            dataProperties[allFields[field]]['valueFormat'] = dataFormatDict[String(measure['value_format'])];
            if (measure['type'] == "yesno") {
              dataProperties[allFields[field]]['dtype'] = "nominal";
            } else {
              dataProperties[allFields[field]]['dtype'] = "quantitative";
            }
            
          } 
        });
        //get friendly names for dimensions
        queryResponse.fields.dimension_like.forEach(function(dimension){
          if (lookerName == dimension['name']) {
            if (typeof dimension['label_short'] != "undefined") {
              dataProperties[allFields[field]]['title'] = dimension['label_short'];
            } else {
              dataProperties[allFields[field]]['title'] = dimension['label'];
            }       
            dataProperties[allFields[field]]['valueFormat'] = dataFormatDict[String(dimension['value_format'])];
            dataProperties[allFields[field]]['dtype'] = "nominal";
          } 
        });
      }

      //construct the tooltip with appropriate formatting
      var tooltipFields = [];

      for (datum in dataProperties) {
        var tip = {};
        tip['field'] = datum;
        tip['type'] = dataProperties[datum]['dtype'];
        tip['format'] = dataProperties[datum]['valueFormat'];
        tip['title'] = dataProperties[datum]['title'];
        tooltipFields.push(tip);
      }


      //switch to compatible mark if trying to utilize shape
      if (config['shape'] != "") {
        config['mark_type'] = "point";
      }
      //set expected size for bar
      // if (config['mark_type'] == "bar") {
      //   config['fixed_size'] = -1;
      // }

      var chart = {
        "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
        "data": {
          "values": myData
        },
        "facet" : {},
        "config": {
          // "circle": {"opacity":config['opacity']},
          // "bar": {"opacity":config['opacity']}
        },
        "spec": {
          "layer": [ {
            "mark": {
              "type": config['mark_type'], 
              "fillOpacity": config['opacity'],
              "stroke": config['border']
            },
            "encoding": {}
          }
          ],
          "width": chartWidth,
          "height": chartHeight         
        }
      };



      ////////////////////////////////////////////
     //check and add another layer if requested//
    ////////////////////////////////////////////
     var layerCount = (chart.spec.layer).length;

     //update sizing
      if (config['mark_type'] == 'circle') {
        config['fixed_size'] = Math.pow(config['fixed_size'],1.8);
      }

      if (config['mark_type2'] == 'circle') {
        config['fixed_size2'] = Math.pow(config['fixed_size2'],1.8);
      }

     //add another layer on the X axis
     if (config['x2'] != "" && typeof config['x2'] != "undefined") {
      
      chart.spec.layer[layerCount] = {
        "encoding": {},
        "mark": {
          "type": config['mark_type2'],
          "fillOpacity":config['opacity2'],
          "thickness":3,
          "stroke":config['border2']
          }
        };
      }


      //add another layer on the Y axis
     if (config['y2'] != "" && typeof config['y2'] != "undefined") {
      chart.spec.layer[layerCount] = {
        "encoding": {},
        "mark": {
          "type": config['mark_type2'],
          "fillOpacity":config['opacity2'],
          "thickness":3,
          "stroke":config['border2']
        }
      };

      //use newly selected value on Y
      chart.spec.layer[layerCount].encoding.y = {};
      //re-aggregate the measure if requested, useful for an average line

      } 

      //End additional layer section//     
     ////////////////////////////////

      //add column or row facet
      //row & column facets
      if (config['column'] != "" && typeof config['column'] != "undefined") {
        //add column facet
        chart.facet.column = {"field":config['column'],"type":dataProperties[config['column']]['dtype'],"title": dataProperties[config['column']]['title']};
        // check for independent axes
        if (config['resolve_y'] != "" && config['y'] != "") {
          chart.resolve = {"scale": {"y":"independent"}};
        }
        if (config['resolve_x'] != "" && config['x'] != "") {
          chart.resolve = {"scale": {"x":"independent"}};
        }
      }      
      if (config['row'] != "" && typeof config['row'] != "undefined") {
        //add row facet
        chart.facet.row = {"field":config['row'],"type":dataProperties[config['row']]['dtype'],"title": dataProperties[config['row']]['title']};
        // check for independent axes
        if (config['resolve_y'] != "" && config['y'] != "") {
          chart.resolve = {"scale": {"y":"independent"}};
        }
        if (config['resolve_x'] != "" && config['x'] != "") {
          chart.resolve = {"scale": {"x":"independent"}};
        }        
      }

      //////////////////////////////////////////
      ///End Faceting//////////////////////////
      ////////////////////////////////////////

      //add selection handler to chart
        if (config['highlight'] != "" && typeof config['highlight'] != "undefined") {
          chart.spec.layer[0].selection = {"paintbrush":{
            "type" : "multi",
            "on" : "mouseover", "empty":"all","fields":[config['highlight']]
          }};
        }

    var layerCount = (chart.spec.layer).length;

     //variable to access correct config for mark layer
     var configCounter;
     var firstLoop;
     //apply correct encodings and mark properties for each layer
     for (var l=0; l < layerCount; l++) {
      //add one extra because of poor naming convention on first loop
      if (l==1) {
        firstLoop = 1;
      } else {
        firstLoop = 0;
      }

      if (l == 0) {
        configCounter = "";
      } else {
        configCounter = configCounter || 0;
        configCounter += firstLoop;
        configCounter += 1;
      }

      console.log("config: " + configCounter);
      console.log(l);
    

      //adjust opacity if circle
      if (config['mark_type'+ String(configCounter)] == "circle" || config['mark_type'+ String(configCounter)] == "point") {
        chart.spec.layer[l].mark.opacity = config['opacity'+ String(configCounter)];
      }

      //checks for building viz based on config selections//
     //////////////////////////////////////////////////////

     //add points to line to ensure proper drill through
     var marksNeedingPoints = ["line","trail","area"];
     // "mark": {"type": "line", "color": "green", "point": {"color": "red"}},
     if (marksNeedingPoints.includes(config['mark_type'+ String(configCounter)])) {
      chart.spec.layer[l].mark.point = {"color":config['fixed_color'+ String(configCounter)]};
     }

     // set x and y axis
     if (config['y'+ String(configCounter)] != "" && typeof config['y'+ String(configCounter)] != "undefined") {
      chart.spec.layer[l].encoding.y = {
        "field": config['y'+ String(configCounter)], 
        "type": dataProperties[config['y'+ String(configCounter)]]['dtype'], 
        "title": dataProperties[config['y'+ String(configCounter)]]['title'], 
        "scale": {"zero": config['unpin_y'+ String(configCounter)]}
      };
     }

     //set tooltip
     chart.spec.layer[l].encoding.tooltip = tooltipFields;

     if (config['x'+ String(configCounter)] != "" && typeof config['x'+ String(configCounter)] != "undefined") {
      chart.spec.layer[l].encoding.x = {
        "field": config['x'+ String(configCounter)], 
        "type": dataProperties[config['x'+ String(configCounter)]]['dtype'], 
        "title": dataProperties[config['x'+ String(configCounter)]]['title'],
        "scale": {"zero": config['unpin_x'+ String(configCounter)]}
      };
     }

      //coloring properties layer 1//

      //list of categorical schemes not compatible with sequential data
      var myColorPalettes = ["tableau10","tableau20","dark2","category20b","set2"];

      //change color domain based on user input
      if (config['domain'+ String(configCounter)] != "" && typeof config['domain'+ String(configCounter)] != "undefined") {
        var colorDomain = [];
        //parse the string input by user into array of integers
        for (num in config['domain'+ String(configCounter)].split(",")) {
          colorDomain.push(Number(config['domain'+ String(configCounter)].split(",")[num]));
        }       
      }

      //set highlighting based on selection, use color selected on marks page
      if (config['highlight'] != "" && typeof config['highlight'] != "undefined") {
        //assign default color if none selected
        if (config['color_scheme'] == "") {
          config['color_scheme'] = "tableau10"
        }
        chart.spec.layer[l].encoding.color = {
        "condition": {
          "scale": {"type":"ordinal","scheme":config['color_scheme'+ String(configCounter)]},
          //use aformentioned select
          "selection" : "paintbrush",
          //field to drive the highlight
          "field":config['highlight'], "type": dataProperties[config['highlight']]['dtype'], "title": dataProperties[config['highlight']]['title']
          },
        //value if false 
        "value":"#B8B8B8"
        };
      } else if (config['color'+ String(configCounter)] != "" && typeof config['color'+ String(configCounter)] != "undefined") {
        //if user has changed the field to color by
        //add color setting based on data type
        chart.spec.layer[l].encoding.color = {"field": config['color'+ String(configCounter)], "type": dataProperties[config['color'+ String(configCounter)]]['dtype'],"title": dataProperties[config['color'+ String(configCounter)]]['title']};
        //check if quantitative or nominal
        if (dataProperties[config['color'+ String(configCounter)]]['dtype'] == 'quantitative') {
          //determine scale and scheme based on data type
          if (config['color_scheme'+ String(configCounter)] == "") {
            //if color scheme left on auto, assign the blues
            chart.spec.layer[l].encoding.color.scale = {"type": "sequential", "scheme":"blues"};
          } else {
            //if color scheme is categorical, but used with quantitative data, switch it to the blues by default
            if (myColorPalettes.includes(config['color_scheme'+ String(configCounter)])) {config['color_scheme'+ String(configCounter)] = "blues";}
            //apply new color scheme for sequential data, include domain manually provided
            chart.spec.layer[l].encoding.color.scale = {"type": "sequential", "scheme": {"name" : config['color_scheme'+ String(configCounter)]}, "domain" : colorDomain};
          }
        } else if (dataProperties[config['color'+ String(configCounter)]]['dtype'] == 'nominal') {
          if (config['color_scheme'+ String(configCounter)] == "") {
            //if color scheme is auto, use tableau10
            chart.spec.layer[l].encoding.color.scale = {"type": "ordinal", "scheme":"tableau10"};
          } else {
            //assign selected color scheme otherwise - ordinal will work with quantitative data so no checking required
            chart.spec.layer[l].encoding.color.scale = {"type": "ordinal", "scheme":config['color_scheme'+ String(configCounter)]};
          }
        }
      } else {
        if (config['mark_type'+ String(configCounter)] == "line") {
          //color the stoke if it's a line to avoid it being filled
          chart.spec.layer[l].mark.stroke = config['fixed_color'+ String(configCounter)];
        } else {
          //color the fill of the mark if not a line
          chart.spec.layer[l].mark.fill = config['fixed_color'+ String(configCounter)];
        }
      }
      //End coloring section//

      var sizableMarks = ["point", "square", "circle", "tick", "bar", "text"];

      //shape properties
      if (config['shape'+ String(configCounter)] != "" && typeof config['shape'+ String(configCounter)] != "undefined") {
        chart.spec.layer[l].encoding.shape = {"field": config['shape'+ String(configCounter)], "type": dataProperties[config['shape'+ String(configCounter)]]['dtype'],"title": dataProperties[config['shape'+ String(configCounter)]]['title']};
      }

      //set style of line
      if (config['line_style'+ String(configCounter)] != "" && typeof config['line_style'+ String(configCounter)] != "undefined" && config['mark_type'+ String(configCounter)] == "line") {
        chart.spec.layer[l].mark.interpolate = config['line_style'+ String(configCounter)];
      }

      //sizing properties
      if (config['size'+ String(configCounter)] != "" && typeof config['size'+ String(configCounter)] != "undefined") {
        chart.spec.layer[l].encoding.size = {"field": config['size'+ String(configCounter)], "type": dataProperties[config['size'+ String(configCounter)]]['dtype'],"title": dataProperties[config['size'+ String(configCounter)]]['title']};
      } else {
        if (config['mark_type'+ String(configCounter)] == "bar") {
          if (config['fixed_size'+ String(configCounter)] == 12) {
            chart.spec.layer[l].mark.discreteBandSize = 1;
          } else {
            chart.spec.layer[l].mark.size = config['fixed_size'+ String(configCounter)]
          }
        } else {
          chart.spec.layer[l].mark.size = config['fixed_size'+ String(configCounter)];
        }
        
      }
    }

      //order properties for stacked bars
      if (config['order'] != "" && typeof config['order'] != "undefined") {
        chart.spec.layer[0].encoding.order = {"field":config['order'], "type":dataProperties[config['order']]['dtype'], "sort":config['order_type']};
      }

      //sorting properties for bar charts mainly
      if (config['sort'] != "" && typeof config['sort'] != "undefined") {
        if (dataProperties[config['y']]['dtype'] == "nominal") {
          chart.spec.layer[0].encoding.y.sort = {"field":config['sort'],"op":"sum" ,"order":config['sort_type']}; //"type":dataProperties[config['sort']]['dtype'],
        } else if (dataProperties[config['x']]['dtype'] == "nominal") {
          chart.spec.layer[0].encoding.x.sort = {"field":config['sort'],"op":"sum","order":config['sort_type']}; //"type":dataProperties[config['sort']]['dtype'],
        }
      }

     //color domain for second layer
      if (config['domain2'] != "" && typeof config['domain2'] != "undefined") {
        var colorDomain2 = [];
        //parse the string input by user into array of integers
        for (num in config['domain2'].split(",")) {
          colorDomain2.push(Number(config['domain2'].split(",")[num]));
        }       
      }

      var layerCount = (chart.spec.layer).length-1;

      if (config['x2'] != "" && typeof config['x2'] != "undefined") {
        chart.spec.layer[layerCount].encoding.y = {
          "field": config['y'],
          "type": dataProperties[config['y']]['dtype'],
          "scale": {"zero": config['unpin_y']}      
        }
      }

      if (config['y2'] != "" && typeof config['y2'] != "undefined") {
        chart.spec.layer[layerCount].encoding.x = {
          "field": config['x'],
          "type": dataProperties[config['x']]['dtype'],
          "scale": {"zero": config['unpin_x']} 
        }
      }

      //reference line settings
      //update to try y first, use x if no y specified
      if (config['averageX'] != "" && typeof config['averageX'] != "undefined") {
        var axisSelect = "y";
        if (config['y'] == "" || typeof config['y'] == "undefined") {
          config['y'] = config['x'];
          axisSelect = "x";
        }

        chart.spec.layer[0].selection = {
            "refBrush": {
              "type": "interval",
              "encodings": [axisSelect]
            }};

        chart.spec.layer[(chart.spec.layer).length] = {
          "transform": [{
            "filter": {"selection": "refBrush"}
          }],
          "mark": {
            "type": "rule",
            "size": 2,
            "color": "black"
          },
          "encoding": {
            "tooltip": {
              "field": config['x'],
              "type": dataProperties[config['x']]['dtype'],
              "format": dataProperties[config['x']]['valueFormat'],
              "aggregate": config['averageX'],
              "title": config['averageX'] + " of " + dataProperties[config['x']]['title']
            },
            "x": {
              "field": config['x'],
              "type": dataProperties[config['x']]['dtype'],
              "scale": {"zero":config['unpin_x']},
              "aggregate": config['averageX']
          },
          "opacity": {"value": 0.8}
        }
      };

        chart.spec.layer[(chart.spec.layer).length] = {
          "mark": {
            "type": "rule",
            "size": 2,
            "color": "black"
          },
          "encoding": {
            "tooltip": {
              "field": config['x'],
              "type": dataProperties[config['x']]['dtype'],
              "format": dataProperties[config['x']]['valueFormat'],
              "aggregate": config['averageX'],
              "title": config['averageX'] + " of " + dataProperties[config['x']]['title']
            },
            "x": {
              "field": config['x'],
              "type": dataProperties[config['x']]['dtype'],
              "scale": {"zero":config['unpin_x']},
              "aggregate": config['averageX']
          },
          "opacity": {"value": 0.4}
        }
      };
    }

      //y axis reference line
      ///////////////////////
      if (config['averageY'] != "" && typeof config['averageY'] != "undefined") {

        var axisSelect = "x";
        //use y axis if no x axis field (ie bubble plot using row instead of axis)
        if (config['x'] == "" || typeof config['x'] == "undefined") {
          config['x'] = config['y'];
          axisSelect = "y";
        }

        chart.spec.layer[0].selection = {
            "refBrush": {
              "type": "interval",
              "encodings": [axisSelect]
            }};

        chart.spec.layer[(chart.spec.layer).length] = {
          "transform": [{
            "filter": {"selection": "refBrush"}
          }],
          "mark": {
            "type": "rule",
            "size": 2,
            "color": "black"
          },
          "encoding": {
            "tooltip": {
              "field": config['y'],
              "type": dataProperties[config['y']]['dtype'],
              "format": dataProperties[config['y']]['valueFormat'],
              "aggregate": config['averageY'],
              "title": config['averageY'] + " of " + dataProperties[config['y']]['title']
            },
            "y": {
              "field": config['y'],
              "type": dataProperties[config['y']]['dtype'],
              "scale": {"zero":config['unpin_y']},
              "aggregate": config['averageY']
          },
          "opacity": {"value": 0.8}
        }
      };

        chart.spec.layer[(chart.spec.layer).length] = {
          "mark": {
            "type": "rule",
            "size": 2,
            "color": "black"
          },
          "encoding": {
            "tooltip": {
              "field": config['y'],
              "type": dataProperties[config['y']]['dtype'],
              "format": dataProperties[config['y']]['valueFormat'],
              "aggregate": config['averageY'],
              "title": config['averageY'] + " of " + dataProperties[config['y']]['title']
            },
            "y": {
              "field": config['y'],
              "type": dataProperties[config['y']]['dtype'],
              "scale": {"zero":config['unpin_y']},
              "aggregate": config['averageY']
          },
          "opacity": {"value": 0.4}
        }
      };
    }




      console.log(chart);

      vegaEmbed("#my-vega", chart, {actions: false}).then(({spec, view}) => {
        view.addEventListener('click', function (event, item) {
          if (event.shiftKey) {
            //opportunity to do something different with a shift click, filter maybe??
          } else {
             LookerCharts.Utils.openDrillMenu({
              links: item.datum.links,
              event: event
          });           
          }

        });
          doneRendering();
      });

}
      
    }
});

function createOptions(queryResponse){

  var masterList = [];
  var dimensionList = [];
  var measureList = [];
  var options = {};
  var defaultDim;
  var defaultMes;
  var optionsResponse = {};
  optionsResponse['options'] = {};
  optionsResponse['measures'] = [];
  optionsResponse['dimensions'] = [];
  optionsResponse['masterList'] = [];

  var dimCounter = 1;
  var mesCounter = 1;

  queryResponse.fields.dimension_like.forEach(function(field){
    var dimLib = {};
    var fieldName = (field.name).replace(".","?");
    if (typeof field.label_short != "undefined") {
      dimLib[field.label_short] = fieldName; //store friendly label & field name
    } else {
      dimLib[field.label] = fieldName; //capture label, mainly for table calcs
    }
    if (dimCounter == 1) {
      defaultDim = fieldName; //grab first dimension to use as default X value
    }
    optionsResponse['masterList'].push(dimLib); //add to master list of all fields
    optionsResponse['dimensions'].push(dimLib);
    dimCounter += 1;
  });

  queryResponse.fields.measure_like.forEach(function(field){
    var mesLib = {};
    var fieldName = (field.name).replace(".","?");
    if (typeof field.label_short != "undefined") {
      mesLib[field.label_short] = fieldName;
      optionsResponse['measures'].push(mesLib);
    } else {
      mesLib[field.label] = fieldName;
      if (field.type == "yesno") {
        optionsResponse['dimensions'].push(mesLib);
      } else {
        optionsResponse['measures'].push(mesLib);
      }
    }
    if (mesCounter == 1) {
      defaultMes = fieldName //grab first measure as default Y value
    }
    optionsResponse['masterList'].push(mesLib);
    
    mesCounter += 1;
  });

  console.log(optionsResponse['measures']);

  var mesLib = {};
  mesLib['NA'] = "";
  optionsResponse['masterList'].push(mesLib);
  optionsResponse['measures'].push(mesLib);
  optionsResponse['dimensions'].push(mesLib);

  optionsResponse['options']['x'] = {
    label: "X",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse['masterList'],
    default: defaultDim
  }
  optionsResponse['options']['y'] = {
    label: "Y",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 2,
    values: optionsResponse['masterList'],
    default: defaultMes
  }
  //Mark config options
  optionsResponse['options']['mark_type'] = {
    label: "Mark Type",
    section: "2.Mark",
    type: "string",
    order: 1,
    display: "select",
    default: "bar",
    values: [
      {"Bar" : "bar"},
      {"Rule" : "rule"},
      {"Circle" : "circle"},
      {"Tick" : "tick"},
      // {"Text" : "text"},
      {"Line" : "line"},
      {"Rect" : "rect"},
      {"Area" : "area"},
      {"Point" : "point"},
      {"Trail" : "trail"}
    ]
  }
  optionsResponse['options']['color'] = {
    label: "Color",
    section: "2.Mark",
    type: "string",
    display: "select",
    order: 2,
    values: optionsResponse['masterList'],
    default: ""
  }
  optionsResponse['options']['color_scheme'] = {
    label: "Color Scheme",
    section: "2.Mark",
    type: "string",
    display: "select",
    order: 3,
    values: [
      {"Auto" : ""},
      {"Default 10 (Categorical)" : "tableau10"},
      {"Default 20 (Categorical)" : "tableau20"},
      {"Dark 8 (Categorical)" : "dark2"},
      {"Dark 20 (Categorical)" : "category20b"},
      {"Light 8 (Categorical)" : "set2"},
      {"Blues (Sequential)" : "blues"},
      {"Greens (Sequential)" : "greens"},
      {"Grays (Sequential)" : "greys"},
      {"Purples (Sequential)" : "purples"},
      {"Oranges (Sequential)" : "oranges"},
      {"Viridis (Sequential Multi)" : "viridis"},
      {"Inferno (Sequential Multi)" : "inferno"},
      {"Magma (Sequential Multi)" : "magma"},
      {"Plasma (Sequential Multi)" : "plasma"},
      {"Blue Purple (Sequential Multi)" : "bluepurple"},
      {"Purple Red (Sequential Multi)" : "purplered"},
      {"Spectral (Diverging)" : "spectral"},
      {"Red Blue (Diverging)" : "redblue"},
      {"Red Gray (Diverging)" : "redgrey"},
      {"Red Green (Diverging)" : "redyellowgreen"},
      {"Brown Green (Diverging)" : "brownbluegreen"}
    ],
    default: ""
  }
  optionsResponse['options']['domain'] = {
    label: "Color Domain",
    section: "2.Mark",
    type: "string",
    display: "text",
    order: 4,
    default: ""
  }
  optionsResponse['options']['size'] = {
    label: "Size",
    section: "2.Mark",
    type: "string",
    display: "select",
    order: 5,
    values: optionsResponse['measures'],
    default: ""
  }
  optionsResponse['options']['shape'] = {
    label: "Shape",
    section: "2.Mark",
    order: 6,
    type: "string",
    display: "select",
    values: optionsResponse['dimensions'],
    default: ""
  }
  optionsResponse['options']['fixed_size'] = {
    label: "Fixed Size",
    section: "2.Mark",
    type: "number",
    display: "range",
    default: 12,
    min: 1,
    max: 128
  }
  optionsResponse['options']['opacity'] = {
    label: "Opacity",
    section: "2.Mark",
    type: "number",
    display: "text",
    default: 1,
    min: 0,
    max: 1
  }
  optionsResponse['options']['line_style'] = {
    label: "Line Style",
    section: "2.Mark",
    type: "string",
    display: "select",
    default: "",
    values:[{"Default":""},{"Monotone":"monotone"},{"Step":"step-after"}]
  }
  optionsResponse['options']['fixed_color'] = {
    label: "Fixed Color",
    section: "2.Mark",
    type: "string",
    display: "text",
    default: "#4C78A8"
  }
  optionsResponse['options']['border'] = {
    label: "Border (Enter color)",
    section: "2.Mark",
    type: "string",
    display: "text",
    default: ""
  }
  //end mark config options layer 1
  /////////////////////////
  //mark config options layer 2
  optionsResponse['options']['mark_type2'] = {
    label: "Mark Type",
    section: "3.Mark(2)",
    type: "string",
    order: 1,
    display: "select",
    default: "bar",
    values: [
      {"Bar" : "bar"},
      {"Rule" : "rule"},
      {"Circle" : "circle"},
      {"Tick" : "tick"},
      // {"Text" : "text"},
      {"Line" : "line"},
      {"Rect" : "rect"},
      {"Area" : "area"},
      {"Point" : "point"},
      {"Trail" : "trail"}
    ]
  }
  optionsResponse['options']['color2'] = {
    label: "Color",
    section: "3.Mark(2)",
    type: "string",
    display: "select",
    order: 2,
    values: optionsResponse['masterList'],
    default: ""
  }
  optionsResponse['options']['color_scheme2'] = {
    label: "Color Scheme",
    section: "3.Mark(2)",
    type: "string",
    display: "select",
    order: 3,
    values: [
      {"Auto" : ""},
      {"Default 10 (Categorical)" : "tableau10"},
      {"Default 20 (Categorical)" : "tableau20"},
      {"Dark 8 (Categorical)" : "dark2"},
      {"Dark 20 (Categorical)" : "category20b"},
      {"Light 8 (Categorical)" : "set2"},
      {"Blues (Sequential)" : "blues"},
      {"Greens (Sequential)" : "greens"},
      {"Grays (Sequential)" : "greys"},
      {"Purples (Sequential)" : "purples"},
      {"Oranges (Sequential)" : "oranges"},
      {"Viridis (Sequential Multi)" : "viridis"},
      {"Inferno (Sequential Multi)" : "inferno"},
      {"Magma (Sequential Multi)" : "magma"},
      {"Plasma (Sequential Multi)" : "plasma"},
      {"Blue Purple (Sequential Multi)" : "bluepurple"},
      {"Purple Red (Sequential Multi)" : "purplered"},
      {"Spectral (Diverging)" : "spectral"},
      {"Red Blue (Diverging)" : "redblue"},
      {"Red Gray (Diverging)" : "redgrey"},
      {"Red Green (Diverging)" : "redyellowgreen"},
      {"Brown Green (Diverging)" : "brownbluegreen"}
    ],
    default: ""
  }
  optionsResponse['options']['domain2'] = {
    label: "Color Domain",
    section: "3.Mark(2)",
    type: "string",
    display: "text",
    order: 4,
    default: ""
  }
  optionsResponse['options']['size2'] = {
    label: "Size",
    section: "3.Mark(2)",
    type: "string",
    display: "select",
    order: 5,
    values: optionsResponse['measures'],
    default: ""
  }
  optionsResponse['options']['shape2'] = {
    label: "Shape",
    section: "3.Mark(2)",
    order: 6,
    type: "string",
    display: "select",
    values: optionsResponse['dimensions'],
    default: ""
  }
  optionsResponse['options']['fixed_size2'] = {
    label: "Fixed Size",
    section: "3.Mark(2)",
    type: "number",
    display: "range",
    default: 12,
    min: 1,
    max: 128
  }
  optionsResponse['options']['opacity2'] = {
    label: "Opacity",
    section: "3.Mark(2)",
    type: "number",
    display: "text",
    default: 1,
    min: 0,
    max: 1
  }
  optionsResponse['options']['line_style2'] = {
    label: "Line Style",
    section: "3.Mark(2)",
    type: "string",
    display: "select",
    default: "",
    values:[{"Default":""},{"Monotone":"monotone"},{"Step":"step-after"}]
  }
  optionsResponse['options']['fixed_color2'] = {
    label: "Fixed Color",
    section: "3.Mark(2)",
    type: "string",
    display: "text",
    default: "#4C78A8"
  }
  optionsResponse['options']['border2'] = {
    label: "Border (Enter color)",
    section: "3.Mark(2)",
    type: "string",
    display: "text",
    default: ""
  }
  //end mark config layer 2
  /////////////////////////
  //axis options
  optionsResponse['options']['row'] = {
    label: "Row",
    section: "1.Axes",
    type: "string",
    order: 3,
    display: "select",
    default: "",
    values: optionsResponse['dimensions']
  }
  optionsResponse['options']['column'] = {
    label: "Column",
    section: "1.Axes",
    type: "string",
    order: 4,
    display: "select",
    default: "",
    values: optionsResponse['dimensions']
  }
  optionsResponse['options']['resolve_x'] = {
    label: "Independent X Axis",
    section: "1.Axes",
    type: "string",
    display: "select",
    default: "",
    order: 5,
    values: [
    {"Yes":"independent"},
    {"No":""}
    ]
  }
  optionsResponse['options']['resolve_y'] = {
    label: "Independent Y Axis",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 7,
    default: "",
    values: [
    {"Yes":"independent"},
    {"No":""}
    ]
  }
  optionsResponse['options']['unpin_x'] = {
    label: "Unpin X from Zero",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 6,
    default: true,
    values: [{"Yes":false},{"No":true}]
  }
  optionsResponse['options']['unpin_y'] = {
    label: "Unpin Y from Zero",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 8,
    default: true,
    values: [{"Yes":false},{"No":true}]   
  }
  optionsResponse['options']['fixed_height'] = {
    label: "Chart Height",
    section: "4.Settings",
    type: "number",
    display: "text",
    default: null,
  }
  optionsResponse['options']['fixed_width'] = {
    label: "Chart Width",
    section: "4.Settings",
    type: "number",
    display: "text",
    default: null,
  }
  // optionsResponse['options']['path'] = {
  //   label: "Path",
  //   section: "2.Mark",
  //   order: 7,
  //   type: "string",
  //   default: "",
  //   display: "select",
  //   values: optionsResponse['dimensions']
  // }
  optionsResponse['options']['highlight'] = {
    label: "Highlight Action",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "",
    values: optionsResponse['dimensions']
  }
  optionsResponse['options']['order'] = {
    label: "Order by (stacked only)",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "",
    values: optionsResponse['measures']
  }
  optionsResponse['options']['order_type'] = {
    label: "Order by Type",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "descending",
    values: [{"Descending":"descending"},{"Ascending":"ascending"}]
  }
  optionsResponse['options']['sort'] = {
    label: "Sort Value",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "",
    values: optionsResponse['masterList']
  }
  optionsResponse['options']['sort_type'] = {
    label: "Sort by Type",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "descending",
    values: [{"Descending":"descending"},{"Ascending":"ascending"}]
  }
  optionsResponse['options']['x2'] = {
    label: "X2",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 1,
    values: optionsResponse['masterList'],
    default: ""    
  }
  optionsResponse['options']['y2'] = {
    label: "Y2",
    section: "1.Axes",
    type: "string",
    display: "select",
    order: 2,
    values: optionsResponse['masterList'],
    default: ""    
  }
  optionsResponse['options']['averageX'] = {
    label: "Reference Line X",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "",
    values: [{"No":""},{"Mean":"mean"},{"Median":"median"},{"Min":"min"},{"Max":"max"}]
  }
  optionsResponse['options']['averageY'] = {
    label: "Reference Line Y",
    section: "4.Settings",
    type: "string",
    display: "select",
    default: "",
    values: [{"No":""},{"Mean":"mean"},{"Median":"median"},{"Min":"min"},{"Max":"max"}]
  }
optionsResponse['options']['labels'] = {
  label: "Labels?",
  section: "4.Settings",
  type: "string",
  display: "select",
  default: "",
  values: optionsResponse['masterList']
  // values: [{"Yes":"yes"},{"No":"no"}]
}

  return optionsResponse;
}