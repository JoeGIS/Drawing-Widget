# Drawing-Widget
## Features
An ArcGIS for JavaScript API widget for drawing a variety of elements on the map.

Military symbol drawing tool utilizes [milsymbol.js - 0.5](http://spatialillusions.com/milsymbol/) according to MIL-STD-2525 and APP6.  This code contains a separate license; details below.

[View it live](http://joerogan.ca/maps/joegis/)


## Quickstart
```javascript
// This sample code is setup to have the Drawing widget contained in a Dojo FloatingPane.  The widget is selects the Point drawing tool when it is opened, and clears the active drawing tools when it is hidden.
// Drawing widget requires the map to be loaded
on(mainMap, "load", function() {
    // Drawing widget
    var drawing = new Drawing({
        map: mainMap
        }, "DrawingWindow");
    drawing.startup();
    
    // When the DrawingWindow is shown
    on(buttonController, "showDrawingWindow", function()
    {
        drawing.changeDrawingTool("drawPoint");
    });
    
    // When the DrawingWindow is hidden
    on(buttonController, "hideDrawingWindow", function()
    {
        drawing.clearDrawingTool();
    });
});
```

## Requirements
* Notepad or HTML editor
* A little background with JavaScript
* Experience with the [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/) would help.

## Setup
Set your dojo config to load the module.

```javascript
var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
var dojoConfig = {
    // The locationPath logic below may look confusing but all its doing is
    // enabling us to load the api from a CDN and load local modules from the correct location.
    packages: [{
        name: "application",
        location: package_path + '/js'
    }]
};
```

## Require module
Include the module for the Drawing widget.

```javascript
require(["application/Drawing", ... ], function(Drawing, ... ){ ... });
```

## Constructor
Drawing(options, srcNode);

### Options (Object)
|property|required|type|value|description|
|---|---|---|---|---|
|map|x|Map|null|ArcGIS JS Map.|
|theme||string|drawingWidget|CSS Class for uniquely styling the widget.|

## Methods
### startup
startup(): Start the widget.  Map object must be loaded first.

## Issues
Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing
Anyone and everyone is welcome to contribute.

## Credits
Military Symbol drawing tool. Copyright (c) 2015 Måns Beckman.  All rights reserved.  For more information including full licence, read  /libs/milsymbol.js 

[Website](http://www.spatialillusions.com)

[Github](https://github.com/spatialillusions/MilSymbol/)

## Licensing
The MIT License (MIT)

Copyright (c) 2016 Joseph Rogan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

