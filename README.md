# Vega-Lite for Looker
Vega is an incredible way to create visualizations, stated in their own words:
# Vega is a visualization grammar, a declarative language for creating, saving, and sharing interactive visualization designs. With Vega, you can describe the visual appearance and interactive behavior of a visualization in a JSON format, and generate web-based views using Canvas or SVG.

More complex Vega visuals in Looker: https://github.com/groodlooker/vega

**New as of 12/22/18 Added Support for mark type 'boxplot'**

**New as of 1/14/18 Support for Labels vega-3.js**

This Looker version adds a number of ui elements to craft visualizations in Vega-Lite, a higher-level language built on top of Vega:

https://vega.github.io/vega-lite/

Versions:

Beta with sort & label fixes:
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-3-1.js

Vega-lite for Looker 1.0
https://s3.us-east-2.amazonaws.com/grood-lookin/vega.js

Vega-lite for Looker 2.0:
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-2.js

Vega-lite for Looker 3.0
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-3.js

Dependencies that need to be added to your Looker Custom Viz are hosted here.
**Please refer to this link https://vega.github.io/vega-lite/usage/embed.html 
for most up-to-date dependencies**
(Newer versions of Vega-lite for Looker may not work without updating to the newest Vega dependencies)

https://cdn.jsdelivr.net/npm/vega@5.0.0-rc2

https://cdn.jsdelivr.net/npm/vega-lite@3.0.0-rc13

https://cdn.jsdelivr.net/npm/vega-embed@3.29.1

All charts you create will maintain their drill paths with additional info about which field is generating the drill link.

A few examples of what you can create with Vega-Lite for Looker:

**Labels available in 3.0**
![Screenshot](screen-shots/labels_stacked.png)
Label can be pinned to the field value or to zero:
![Screenshot](screen-shots/label_pinned_zero.png)
Apply filters/conditions to labels:
![Screenshot](screen-shots/label_filters.png)

**New as of 12/22/18 box plot support**

![Screenshot](screen-shots/standard_box.png)
![Screenshot](screen-shots/colored_boxes.png)

**Multi-layer support availabe in 2.0**

Value vs Target charting:
![Screenshot](screen-shots/value_v_target.png)

Lollipop style charts:
![Screenshot](screen-shots/lollipop.png)

Reference Lines that update on selection:
![Screenshot](screen-shots/movable_ref_line.png)

**Functionality in original vega-lite**

Bar trellising:
![Screenshot](screen-shots/bar_trellis.png)

Multi-facet trellising:
![Screenshot](screen-shots/trellis_region_segment.png)

Bubble Plots:
![Screenshot](screen-shots/bubble_plot.png)

Heatmap:
![Screenshot](screen-shots/heatmap.png)

Scatter Plots:
![Screenshot](screen-shots/scatter_plot_tooltip.png)
![Screenshot](screen-shots/scatter_plot_drill.png)

Highlighting:
![Screenshot](screen-shots/highlight.png)

Vega-Lite enables even richer visualization than this current version of "Vega-Lite for Looker" will allow for. Future iterations of this will include layers or "dual axis" support, cross-highlighting capabilities, more formatting options (line thickness, fonts, etc) and possibly crossfiltering.
