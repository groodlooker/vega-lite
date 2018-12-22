//add the concept of "adding to detail" to support something like a barbell chart?
//fix highlighting with dual axis

looker.plugins.visualizations.add({
    create: function(element, config){

        container = element.appendChild(document.createElement("div"));
        container.setAttribute("id","my-vega");

        var css = document.createElement("style");
        css.type = "text/css";
        css.innerHTML = "#vg-tooltip-element { font-family: Open Sans,Helvetica,Arial,sans-serif}";
        element.appendChild(css);

    },
    updateAsync: function(data, element, config, queryResponse, details, doneRendering){

      var myData = [];
      var dataProperties = {};
      var dims = [];
      var meas = [];
      var allFields = [];
      var options = {};


      options = createOptions(queryResponse)['options'];

      console.log(queryResponse);  

      this.trigger('registerOptions', options);  

      console.log(config);

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
          var shortName = key.replace(".","_");
          dataDict[shortName] = obj[key]['value'];
          if (typeof obj[key]['links'] != "undefined") {

            //create array of all links for a row of data
            for(var l=0;l<obj[key]['links'].length;l++){

              //grab link label and add field name for clarity in menu
              var currentLabel = obj[key]['links'][l]['label'];
              currentLabel = currentLabel + " (" + (key.substring(key.indexOf(".")+1)).replace(/_/g," ") + ")";
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
        var fieldName = (field.name).replace(".","_");
        meas.push(fieldName);      
      });
      //create array of all dimensions for lookup purposes
      queryResponse.fields.dimension_like.forEach(function(field){
        var fieldName = (field.name).replace(".","_");
        dims.push(fieldName);      
      });

      allFields = meas.concat(dims);

      dataProperties = createMetaData(allFields,queryResponse);

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
          "axis": {"titleFont":"Open Sans,Helvetica,Arial,sans-serif","labelFont":"Open Sans,Helvetica,Arial,sans-serif"},
          "header": {"titleFont":"Open Sans,Helvetica,Arial,sans-serif","labelFont":"Open Sans,Helvetica,Arial,sans-serif"},
          "legend": {"titleFont":"Open Sans,Helvetica,Arial,sans-serif","labelFont":"Open Sans,Helvetica,Arial,sans-serif"}
          // "circle": {"opacity":config['opacity']},
          // "bar": {"opacity":config['opacity']}
        },
        "spec": {
          "layer": [ {
            "mark": {
              "type": config['mark_type'], 
              "fillOpacity": config['opacity'],
              "stroke": config['border'][0]
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
      /////////////////////////////////
      //check and add layers///////////
     //add another layer on the X axis
     if (config['x2'] != "" && typeof config['x2'] != "undefined") {
      
      chart.spec.layer[1] = {
        "encoding": {},
        "mark": {
          "type": config['mark_type2'],
          "fillOpacity":config['opacity2'],
          "thickness":3,
          "stroke":config['border2'][0]
          }
        };

        // chart.spec.layer[1].encoding.x = {};

      }

      //add another layer on the Y axis
     if (config['y2'] != "" && typeof config['y2'] != "undefined") {
      chart.spec.layer[1] = {
        "encoding": {},
        "mark": {
          "type": config['mark_type2'],
          "fillOpacity":config['opacity2'],
          "thickness":3,
          "stroke":config['border2'][0]
        }
      };

      //use newly selected value on Y
      // chart.spec.layer[1].encoding.y = {};
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
    
      //adjust opacity if circle
      if (config['mark_type'] == "circle" || config['mark_type'] == "point") {
        chart.spec.layer[0].mark.opacity = config['opacity'];
      }

      if (config['mark_type2'] == "circle" || config['mark_type2'] == "point") {
        if (typeof chart.spec.layer[1] != "undefined") {
          chart.spec.layer[1].mark.opacity = config['opacity2'];
        }
      }

      //checks for building viz based on config selections//
     //////////////////////////////////////////////////////

     //add points to line to ensure proper drill through
     var marksNeedingPoints = ["line","trail","area"];
     // "mark": {"type": "line", "color": "green", "point": {"color": "red"}},
     if (marksNeedingPoints.includes(config['mark_type'])) {
      chart.spec.layer[0].mark.point = {"color":config['fixed_color']};
     }

     if (marksNeedingPoints.includes(config['mark_type2'])) {
      if (typeof chart.spec.layer[1] != "undefined") {
        chart.spec.layer[1].mark.point = {"color":config['fixed_color2']};
      }
     }

     // set x and y axis
     if (config['y'] != "" && typeof config['y'] != "undefined") {
      chart.spec.layer[0].encoding.y = {
        "field": config['y'], 
        "type": dataProperties[config['y']]['dtype'], 
        "title": dataProperties[config['y']]['title'], 
        "scale": {"zero": config['unpin_y']}
      };
     }

      var layerCount = (chart.spec.layer).length-1;

      if (typeof chart.spec.layer[1] != "undefined") {

        if (config['x2'] != "" && typeof config['x2'] != "undefined") {
          chart.spec.layer[1].encoding.y = {
            "field": config['y'],
            "type": dataProperties[config['y']]['dtype'],
            "scale": {"zero": config['unpin_y']}      
          };
          chart.spec.layer[1].encoding.x = {
            "field":config['x2'],
            "type":dataProperties[config['x2']]['dtype'],
            "scale":{"zero":config['x2']}
          };
        }

        if (config['y2'] != "" && typeof config['y2'] != "undefined") {
          chart.spec.layer[1].encoding.x = {
            "field": config['x'],
            "type": dataProperties[config['x']]['dtype'],
            "scale": {"zero": config['unpin_x']} 
          };
          chart.spec.layer[1].encoding.y = {
            "field":config['y2'],
            "type":dataProperties[config['y2']]['dtype'],
            "scale":{"zero":config['y2']}
          }
        }
      }

     //set tooltip
     chart.spec.layer[0].encoding.tooltip = tooltipFields;

     if (typeof chart.spec.layer[1] != "undefined") {
      chart.spec.layer[1].encoding.tooltip = tooltipFields;
     }

     if (config['x'] != "" && typeof config['x'] != "undefined") {
      chart.spec.layer[0].encoding.x = {
        "field": config['x'], 
        "type": dataProperties[config['x']]['dtype'], 
        "title": dataProperties[config['x']]['title'],
        "scale": {"zero": config['unpin_x']}
      };
     }

      //coloring properties layer 1//

      //list of categorical schemes not compatible with sequential data
      var myColorPalettes = ["tableau10","tableau20","dark2","category20b","set2"];

      //change color domain based on user input
      if (config['domain'] != "" && typeof config['domain'] != "undefined") {
        var colorDomain = [];
        //parse the string input by user into array of integers
        for (num in config['domain'].split(",")) {
          colorDomain.push(Number(config['domain'].split(",")[num]));
        }       
      }

     //color domain for second layer
      if (typeof chart.spec.layer[1] != "undefined") {
        if (config['domain'] != "" && typeof config['domain'] != "undefined") {
          var colorDomain2 = [];
          //parse the string input by user into array of integers
          for (num in config['domain'].split(",")) {
            colorDomain2.push(Number(config['domain'].split(",")[num]));
          }       
        } 
      }

      //set default color sceme
      if (config['color_scheme'] == "") {
        config['color_scheme'] = "tableau10"
      }

      if (config['color_scheme2'] == "") {
        config['color_scheme2'] = "tableau10"
      }

      //set highlighting based on selection, use color selected on marks page
      if (config['highlight'] != "" && typeof config['highlight'] != "undefined") {
        //assign default color if none selected
        chart.spec.layer[0].encoding.color = {
        "condition": {
          "scale": {"type":"ordinal","scheme":config['color_scheme']},
          //use aformentioned select
          "selection" : "paintbrush",
          //field to drive the highlight
          "field":config['highlight'], "type": dataProperties[config['highlight']]['dtype'], "title": dataProperties[config['highlight']]['title']
          },
        //value if false 
        "value":"#B8B8B8"
        };
      } else if (config['color'] != "" && typeof config['color'] != "undefined") {
        //if user has changed the field to color by
        //add color setting based on data type
        chart.spec.layer[0].encoding.color = {"field": config['color'], "type": dataProperties[config['color']]['dtype'],"title": dataProperties[config['color']]['title']};
        //check if quantitative or nominal
        if (dataProperties[config['color']]['dtype'] == 'quantitative') {
          //determine scale and scheme based on data type
          if (config['color_scheme'] == "") {
            //if color scheme left on auto, assign the blues
            chart.spec.layer[0].encoding.color.scale = {"type": "sequential", "scheme":"blues"};
          } else {
            //if color scheme is categorical, but used with quantitative data, switch it to the blues by default
            if (myColorPalettes.includes(config['color_scheme'])) {config['color_scheme'] = "blues";}
            //apply new color scheme for sequential data, include domain manually provided
            chart.spec.layer[0].encoding.color.scale = {"type": "sequential", "scheme": {"name" : config['color_scheme']}, "domain" : colorDomain};
          }
        } else if (dataProperties[config['color']]['dtype'] == 'nominal') {
          if (config['color_scheme'] == "") {
            //if color scheme is auto, use tableau10
            chart.spec.layer[0].encoding.color.scale = {"type": "ordinal", "scheme":"tableau10"};
          } else {
            //assign selected color scheme otherwise - ordinal will work with quantitative data so no checking required
            chart.spec.layer[0].encoding.color.scale = {"type": "ordinal", "scheme":config['color_scheme']};
          }
        }
      } else {
        if (config['mark_type'] == "line") {
          //color the stoke if it's a line to avoid it being filled
          chart.spec.layer[0].mark.stroke = config['fixed_color'];
        } else {
          //color the fill of the mark if not a line
          chart.spec.layer[0].mark.fill = config['fixed_color'];
        }
      }
      //End coloring section layer 1//
      ///////////////////////////////
      ///////////////////////////////
      //Begin coloring section layer 2//

      
    if (typeof chart.spec.layer[1] != "undefined") {

      if (config['color'] != "" && typeof config['color'] != "undefined" && config['color2'] == "" && config['fixed_color2'] == "") {

        //if user has changed the field to color by
        //add color setting based on data type
        chart.spec.layer[1].encoding.color = {"field": config['color'], "type": dataProperties[config['color']]['dtype'],"title": dataProperties[config['color']]['title']};
        //check if quantitative or nominal
        if (dataProperties[config['color']]['dtype'] == 'quantitative') {
          //determine scale and scheme based on data type
          if (config['color_scheme'] == "") {
            //if color scheme left on auto, assign the blues
            chart.spec.layer[1].encoding.color.scale = {"type": "sequential", "scheme":"blues"};
          } else {
            //if color scheme is categorical, but used with quantitative data, switch it to the blues by default
            if (myColorPalettes.includes(config['color_scheme2'])) {config['color_scheme2'] = "blues";}
            //apply new color scheme for sequential data, include domain manually provided
            chart.spec.layer[1].encoding.color.scale = {"type": "sequential", "scheme": {"name" : config['color_scheme']}, "domain" : colorDomain2};
          }
        } else if (dataProperties[config['color']]['dtype'] == 'nominal') {
          if (config['color_scheme'] == "") {
            //if color scheme is auto, use tableau10
            chart.spec.layer[1].encoding.color.scale = {"type": "ordinal", "scheme":"tableau10"};
          } else {
            //assign selected color scheme otherwise - ordinal will work with quantitative data so no checking required
            chart.spec.layer[1].encoding.color.scale = {"type": "ordinal", "scheme":config['color_scheme']};
          }
        }        
      } else if (config['color2'] != "" && typeof config['color2'] != "undefined" && config['color'] == "") {
        //if user has changed the field to color by
        //add color setting based on data type
        chart.spec.layer[1].encoding.color = {"field": config['color2'], "type": dataProperties[config['color2']]['dtype'],"title": dataProperties[config['color2']]['title']};
        //check if quantitative or nominal
        if (dataProperties[config['color2']]['dtype'] == 'quantitative') {
          //determine scale and scheme based on data type
          if (config['color_scheme2'] == "") {
            //if color scheme left on auto, assign the blues
            chart.spec.layer[1].encoding.color.scale = {"type": "sequential", "scheme":"blues"};
          } else {
            //if color scheme is categorical, but used with quantitative data, switch it to the blues by default
            if (myColorPalettes.includes(config['color_scheme2'])) {config['color_scheme2'] = "blues";}
            //apply new color scheme for sequential data, include domain manually provided
            chart.spec.layer[1].encoding.color.scale = {"type": "sequential", "scheme": {"name" : config['color_scheme2']}, "domain" : colorDomain2};
          }
        } else if (dataProperties[config['color2']]['dtype'] == 'nominal') {
          if (config['color_scheme2'] == "") {
            //if color scheme is auto, use tableau10
            chart.spec.layer[1].encoding.color.scale = {"type": "ordinal", "scheme":"tableau10"};
          } else {
            //assign selected color scheme otherwise - ordinal will work with quantitative data so no checking required
            chart.spec.layer[1].encoding.color.scale = {"type": "ordinal", "scheme":config['color_scheme2']};
          }
        }
      } else {
        if (config['mark_type2'] == "line") {
          //color the stoke if it's a line to avoid it being filled
          chart.spec.layer[1].mark.stroke = config['fixed_color2'];
        } else {
          //color the fill of the mark if not a line
          chart.spec.layer[1].mark.fill = config['fixed_color2'];
        }
      }
    }


      var sizableMarks = ["point", "square", "circle", "tick", "bar", "text"];

      //shape properties
      if (config['shape'] != "" && typeof config['shape'] != "undefined") {
        chart.spec.layer[0].encoding.shape = {"field": config['shape'], "type": dataProperties[config['shape']]['dtype'],"title": dataProperties[config['shape']]['title']};
      }

      //shape properties layer 2
      if (typeof chart.spec.layer[1] != "undefined") {
        if (config['shape2'] != "" && typeof config['shape2'] != "undefined") {
          chart.spec.layer[1].encoding.shape = {"field": config['shape2'], "type": dataProperties[config['shape2']]['dtype'],"title": dataProperties[config['shape2']]['title']};
        }        
      }

      //set style of line
      if (config['line_style'] != "" && typeof config['line_style'] != "undefined" && config['mark_type'] == "line") {
        chart.spec.layer[0].mark.interpolate = config['line_style'];
      }

      //set style of line 2
      if (typeof chart.spec.layer[1] != "undefined") {
        if (config['line_style2'] != "" && typeof config['line_style2'] != "undefined" && config['mark_type2'] == "line") {
          chart.spec.layer[1].mark.interpolate = config['line_style2'];
        }        
      }

      //sizing properties
      if (config['size'] != "" && typeof config['size'] != "undefined") {
        chart.spec.layer[0].encoding.size = {"field": config['size'], "type": dataProperties[config['size']]['dtype'],"title": dataProperties[config['size']]['title']};
      } else {
        if (config['mark_type'] == "bar") {
          if (config['fixed_size'] == 12) {
            chart.spec.layer[0].mark.discreteBandSize = 1;
          } else {
            chart.spec.layer[0].mark.size = config['fixed_size']
          }
        } else {
          chart.spec.layer[0].mark.size = config['fixed_size'];
        }
        
      }

      //sizing properties 2
      if (typeof chart.spec.layer[1] != "undefined") {
        if (config['size2'] != "" && typeof config['size2'] != "undefined") {
          chart.spec.layer[1].encoding.size = {"field": config['size2'], "type": dataProperties[config['size2']]['dtype'],"title": dataProperties[config['size2']]['title']};
        } else {
          if (config['mark_type2'] == "bar") {
            if (config['fixed_size2'] == 12) {
              chart.spec.layer[1].mark.discreteBandSize = 1;
            } else {
              chart.spec.layer[1].mark.size = config['fixed_size2']
            }
          } else {
            chart.spec.layer[1].mark.size = config['fixed_size2'];
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

    if (config['mark_type'] == 'boxplot') {
      if (config['color'] == "" || typeof config['color'] == "undefined") {
        chart.spec.layer[0].encoding.color = {"value":config['fixed_color'][0]};
      } else {
        chart.spec.layer[0].encoding.color = {"field":config['color'],"type":dataProperties[config['color']]['dtype'],"title":dataProperties[config['color']]['title']};
        chart.spec.layer[0].encoding.color.scale = {"type": "ordinal", "scheme":config['color_scheme']};
      }
      
      // chart.spec.layer[0].encoding.opacity = {"value":config['opacity']};

      if (config['boxplotExtent'] == "1.5") {
        config['boxplotExtent'] = Number(config['boxplotExtent']);
      }
      chart.config.boxplot = {
        "extent": config['boxplotExtent'],
        "median": {"color":config['boxMedian'][0],"thickness":2,"ticks":true}
      }
      chart.config.bar = {
        "stroke": config['border'][0],
        "fill": config['fixed_color'][0],
        "fillOpacity": config['opacity']
      }
    }

      console.log(chart);

      var tooltipOptions = {
        theme: 'dark'
      };

      var opt = {
        "actions": false,
        "tooltip": tooltipOptions
      };

      vegaEmbed("#my-vega", chart, opt).then(({spec, view}) => {
        var tips = document.getElementsByClassName("vg-tooltip");
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

function createMetaData(allFields,queryResponse){

  var dataFormatDict = {
    "$#,##0" : "$,.0f",
    "$#,##0.00" : "$,.2f",
    "#,##0.00%" : ",.2%",
    "#,##0.0%" : ",.1%",
    "#,##0%" : ",.0%",
    "null" : ""
  };

  var dateFields = ["date_date", "date_month", "date_quarter", "date_week"];

  var dataProperties = {};
  //determine number format
  for (var field in allFields) {
    var lookerName = allFields[field];
    dataProperties[allFields[field]] = {};
    //get friendly names for measures
    queryResponse.fields.measure_like.forEach(function(measure){
      if (lookerName == measure['name'].replace(".","_")) {
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
      if (lookerName == dimension['name'].replace(".","_")) {
        if (typeof dimension['label_short'] != "undefined") {
          dataProperties[allFields[field]]['title'] = dimension['label_short'];
        } else {
          dataProperties[allFields[field]]['title'] = dimension['label'];
        }       
        dataProperties[allFields[field]]['valueFormat'] = dataFormatDict[String(dimension['value_format'])];
        if (dateFields.includes(dimension.type)) {
          dataProperties[allFields[field]]['dtype'] = "temporal";
        } else {
          dataProperties[allFields[field]]['dtype'] = "nominal";
        }
      } 
    });
  }
  return dataProperties;
}

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
    var fieldName = (field.name).replace(".","_");
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
    var fieldName = (field.name).replace(".","_");
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
      {"Box Plot" : "boxplot"},
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
    type: "array",
    display: "color",
    default: "#4C78A8"
  }
  optionsResponse['options']['border'] = {
    label: "Border (Enter color)",
    section: "2.Mark",
    type: "array",
    display: "color",
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
      {"Box Plot" : "boxplot"},
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
    type: "array",
    display: "color",
    default: "#4C78A8"
  }
  optionsResponse['options']['border2'] = {
    label: "Border (Enter color)",
    section: "3.Mark(2)",
    type: "array",
    display: "color",
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
    order: 1,
    display: "text",
    default: null,
  }
  optionsResponse['options']['fixed_width'] = {
    label: "Chart Width",
    section: "4.Settings",
    type: "number",
    order: 2,
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
    order: 3,
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
optionsResponse['options']['boxplotExtent'] = {
  label: "Box Plot Extent",
  section: "4.Settings",
  type: "string",
  display: "select",
  default: "",
  order:19,
  values: [{"1.5 IQR":"1.5"},{"Min-Max":"min-max"}]
}
optionsResponse['options']['boxMedian'] = {
  label: "Box Plot Median",
  section: "4.Settings",
  type: "array",
  display: "color",
  default: "black",
  order:20
}
// optionsResponse['options']['labels'] = {
//   label: "Labels?",
//   section: "4.Settings",
//   type: "string",
//   display: "select",
//   default: "",
//   values: optionsResponse['masterList']
//   // values: [{"Yes":"yes"},{"No":"no"}]
// }

  return optionsResponse;
}