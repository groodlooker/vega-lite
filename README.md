# Vega-Lite for Looker
Vega is an incredible way to create visualizations, stated in their own words:
# Vega is a visualization grammar, a declarative language for creating, saving, and sharing interactive visualization designs. With Vega, you can describe the visual appearance and interactive behavior of a visualization in a JSON format, and generate web-based views using Canvas or SVG.

More complex Vega visuals in Looker: https://github.com/groodlooker/vega

This Looker version adds a number of ui elements to craft visualizations in Vega-Lite, a higher-level language built on top of Vega:

https://vega.github.io/vega-lite/

**NEW as of 07/08/2020 a bundled version - simply drop in the "Main" section. No more dependencies needed.**
https://storage.googleapis.com/custom-visualizations/bundle.js

Dependencies that need to be added to your Looker Custom Viz are hosted here.

**Use these dependencies for Vega 3.2** 

https://cdn.jsdelivr.net/npm/vega@5.4.0

https://cdn.jsdelivr.net/npm/vega-lite@3.4.0

https://cdn.jsdelivr.net/npm/vega-embed@4.2.1

**If using older versions of vega and having issues, try these dependencies**

(Newer versions of Vega-lite for Looker may not work without updating to the newest Vega dependencies)

https://cdn.jsdelivr.net/npm/vega@5.0.0-rc2

https://cdn.jsdelivr.net/npm/vega-lite@3.0.0-rc13

https://cdn.jsdelivr.net/npm/vega-embed@3.29.1

Versions:

Vega-lite for Looker 3.2 with Legend & Size Control:
https://grood-lookin.s3.us-east-2.amazonaws.com/vega-3-2.js

Vega-lite for Looker 3.1 with sort & label fixes:
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-3-1.js

Vega-lite for Looker 3.0
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-3.js

Vega-lite for Looker 1.0
https://s3.us-east-2.amazonaws.com/grood-lookin/vega.js

Vega-lite for Looker 2.0:
https://s3.us-east-2.amazonaws.com/grood-lookin/vega-2.js


All charts you create will maintain their drill paths with additional info about which field is generating the drill link.

A few examples of what you can create with Vega-Lite for Looker:

**Move Legend in 3.2 (& two Looker color Palettes)**
![Screenshot](screen-shots/legend.png)

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
