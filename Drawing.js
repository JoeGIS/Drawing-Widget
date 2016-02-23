/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////-------Drawing.js-------//////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
// 
// Version: 2.0
// Author: Joseph Rogan (joseph.rogan@forces.gc.ca canadajebus@gmail.com)
// 
// 
// This reusable widget allows the user to draw a variety of elements on the map.
// 
// Drawing widget requires the map to be loaded
// on(mainMap, "load", function() {
    // Drawing widget
    // var drawing = new Drawing({
        // map: mainMap
        // }, "DrawingWindow");
    // drawing.startup();
    //
    // When the DrawingWindow is shown
    // on(buttonController, "showDrawingWindow", function()
    // {
        // drawing.changeDrawingTool("drawPoint");
    // });
    //
    // When the DrawingWindow is hidden
    // on(buttonController, "hideDrawingWindow", function()
    // {
        // drawing.clearDrawingTool();
    // });
// });
//
// 
// Changes:
// Version 2.0
//  -added Military Symbol drawing tool. Copyright (c) 2015 Måns Beckman  
//   http://www.spatialillusions.com All rights reserved.  For more information,
//   read  /libs/milsymbol.js 
// 
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

define([
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin", 
    
    "dojo/_base/declare",
    "dojo/_base/lang", 
    "dojo/on",
    "require",
    
    "esri/graphic", 
    
    "esri/symbols/Font", 
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol", 
    "esri/Color",
    
    "esri/geometry/Point", 
    
    "esri/toolbars/draw", 
    "esri/toolbars/edit", 
    
    "dijit/ColorPalette", 
    "dijit/popup", 
    "dijit/TooltipDialog", 
    
    "dijit/Menu", 
    "dijit/MenuItem", 
    "dijit/MenuSeparator", 
    "dijit/PopupMenuItem", 
    
    "dijit/form/CheckBox",
    "dijit/form/DropDownButton", 
    "dijit/form/HorizontalSlider", 
    "dijit/form/NumberSpinner", 
    "dijit/form/TextBox",
    
    "./Drawing/libs/milsymbol",
    "./Drawing/libs/milSymbolCodeGenerator", 
    "./Drawing/libs/base64", 
    
    "dojo/text!./Drawing/templates/Drawing.html",
    
    "dojo/dom", 
    "dojo/dom-construct", 
    "dojo/domReady!"

], function(_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, 
    declare, lang, on, require, 
    Graphic, 
    Font, PictureMarkerSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Color, 
    Point, 
    Draw, Edit, 
    ColorPalette, popup, TooltipDialog, 
    Menu, MenuItem, MenuSeparator, PopupMenuItem, 
    CheckBox, DropDownButton, HorizontalSlider, NumberSpinner, TextBox, 
    milsymbol, milSymbolCodeGenerator, base64, 
    dijitTemplate, dom, domConstruct)
{
    
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        
        // Set the template .html file
        templateString: dijitTemplate,
        
        // Path to the templates .css file
        css_path: require.toUrl("./Drawing/css/Drawing.css"),
        
        
        // The defaults
        defaults: {
            map: null, 
            theme: "drawingWidget",
            defaultTool: "drawPoint"
        },
        
        // Toolbar objects
        drawToolbar: null, 
        editToolbar: null, 
        
        fpWidth: 315,
        fpHeight: 280,
        
        // Vars
        currentTool: "", 
        tooltip: null,
        selected: null, 
        addText: null, 
        color: Color.fromHex("#000"), 
        bold: Font.WEIGHT_NORMAL, 
        underline: "none", 
        italic: Font.STYLE_NORMAL, 
        solidfill: SimpleFillSymbol.STYLE_NULL, 
        milSymbolMarker: null, 
        
        // Called when the widget is declared as new object
        constructor: function(options) {
            // Mix in the given options with the defaults
            var properties = lang.mixin({}, this.defaults, options);
            this.set(properties);
            
            this.css = {
                drawingControlsDiv: "drawingControlsDiv", 
                drawClearGrpahics: "drawClearGrpahics", 
                drawingTool: "drawingTool", 
                drawingColorButton: "drawingColorButton", 
                drawSize: "drawSize", 
                fontTool: "fontTool", 
                drawTransparencySlider: "drawTransparencySlider", 
                drawTransparencyString: "drawTransparencyString", 
                drawSolidFillDiv: "drawSolidFillDiv", 
                drawTextString: "drawTextString",
                milSymbolPropertiesDiv: "milSymbolPropertiesDiv", 
                labelMilSymbol: "labelMilSymbol", 
                labelMilSymbolText: "labelMilSymbolText", 
                selectMilSymbol: "selectMilSymbol",
                inputMilSymbolText: "inputMilSymbolText", 
                previewMilSymbolImg: "previewMilSymbolImg"
            };
            
        },
        
        // Called after the widget is created
        postCreate: function() {
            this.inherited(arguments);
            
            
            // Set the button image sources
            this.drawMilSymbol.src = require.toUrl("./Drawing/images/mil_symbol.png");
            this.drawPoint.src = require.toUrl("./Drawing/images/point.png");
            this.drawPolyline.src = require.toUrl("./Drawing/images/polyline.png");
            this.drawFreehand_Polyline.src = require.toUrl("./Drawing/images/freehand_polyline.png");
            this.drawPolygon.src = require.toUrl("./Drawing/images/polygon.png");
            this.drawFreehand_Polygon.src = require.toUrl("./Drawing/images/freehand_polygon.png");
            this.drawCircle.src = require.toUrl("./Drawing/images/circle.png");
            this.drawEllipse.src = require.toUrl("./Drawing/images/ellipse.png");
            this.drawText.src = require.toUrl("./Drawing/images/text.png");
            this.drawFontBold.src = require.toUrl("./Drawing/images/bold.png");
            this.drawFontUnderline.src = require.toUrl("./Drawing/images/underline.png");
            this.drawFontItalic.src = require.toUrl("./Drawing/images/italic.png");
            
            
            
            // Allow this. to be used in the events scope
            var _this = this;
            
            // Create a draw toolbar object and wire it's event for drawing on the map
            this.drawToolbar = new Draw(this.map);
            on(this.drawToolbar, "draw-end", function (evt, $_this) {
                _this.addDrawingToMap(evt, _this);
                });
            
            // Create an edit toolbar object and wire it's event for editing on the map
            this.editToolbar = new Edit(this.map);
            on(this.map, "click", function (evt, $_this) {
                _this.editToolbar.deactivate();
                });
            
            // Create the right click context menu for the graphics
            this.createDrawingContextMenu();
            
        },
        
        
        // Called when the widget.startup() is used to view the widget
        startup: function() {
            this.inherited(arguments);
            
            // Update select boxes with defaults
            milSymbolCodeGenerator.battledimensionValues();
            milSymbolCodeGenerator.functionIdValues();
            milSymbolCodeGenerator.modifier12Values();
            
            // Default mil symbol values
            document.getElementById('SIDCCODINGSCHEME').value = "S";
            this._changeSIDCCODINGSCHEME();
            document.getElementById('SIDCAFFILIATION').value = "F";
            this._changeSIDCAFFILIATION();
            document.getElementById('SIDCBATTLEDIMENSION').value = "G";
            this._changeSIDCBATTLEDIMENSION();
            
        },
        
        
        // Adds a drawing to the map
        addDrawingToMap: function(evt, _this)
        {
            var symbol = null;
            
            // If there was not a drawing event
            if (evt === undefined)
            {
                console.log("undefined");
            }
            else // There was a drawing event
            {
                //  Create the symbol for the appropriate geometry
                switch (evt.geometry.type)
                {
                    case "point":
                        
                    case "multipoint":
                        symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 
                                _this.drawSize.value, 
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, _this.color, 1), 
                                _this.color);
                        if (_this.currentTool == "drawMilSymbol") symbol = _this._createMilSymbol();
                        break;
                    case "polyline":
                        symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, 
                                _this.color, 
                                _this.drawSize.value)
                        break;
                    default:
                        symbol = new SimpleFillSymbol(_this.solidfill, 
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                _this.color, _this.drawSize.value), 
                                _this.color);
                        break;
                }
            }
            // Add to the map's graphics layer
            _this.map.graphics.add(new Graphic(evt.geometry, symbol));
            
            // Clear the drawing tool
            _this.clearDrawingTool();
        },
        
        
        
        // Clears the drawing tool
        clearDrawingTool: function()
        {
            // Reset all the buttons
            try { dom.byId(this.currentTool).className = "drawingTool"; } catch(e) {}
            
            // Reset the tools
            try { this.addText.remove(); } catch(e) {}
            try { this.drawToolbar.deactivate(); } catch(e) {}
            try { domConstruct.destroy(this.tooltip); } catch(e) {}
            this.currentTool = "";
        },
        
        
        // Changes the drawing tool
        changeDrawingTool: function(toolName) {
            
            // If we are changing tools
            if (this.currentTool != toolName)
            {
                if (this.currentTool != "") dom.byId(this.currentTool).className = "drawingTool";
                this.currentTool = toolName;
                dom.byId(toolName).className = "drawingToolSelected";
            }
            else // Same tool, disable it and all tools
            {
                this.clearDrawingTool();
                return;
            }
            
            // If we are drawing a Mil Symbol
            if (toolName == "drawMilSymbol")
            {
                this.BasicShapesDiv.style.display = "none";
                this.MilSymbolDiv.style.display = "";
            }
            else // Basic Shape tool
            {
                this.MilSymbolDiv.style.display = "none";
                this.BasicShapesDiv.style.display = "";
            }
            
            
            // Change the label for size/thickness for point/other drawing
            if (toolName == "drawPoint" | toolName == "drawText") this.drawSizeLabel.innerHTML = "Size: ";
            else this.drawSizeLabel.innerHTML = "Thickness: ";
            
            // Show or hide the solid fill checkbox for polygons/other (css: visibility: hidden, so it still takes up space)
            if (toolName == "drawPolygon" | toolName == "drawFreehand_Polygon" | toolName == "drawCircle" | toolName == "drawEllipse")
            {
                this.drawSolidFillDiv.style.display = "";
            }
            else
            {
                this.drawSolidFillDiv.style.display = "none";
            }
            
            // If it's a normal drawing tool (including mil symbols)
            if (toolName != "drawText")
            {
                // Try to remove the add text click event, if it exists
                try { this.addText.remove(); } catch(e) {}
                
                // Hide the text font buttons (css: display: none, so it doesn't take up space)
                this.drawFontDiv.style.display = "none";
                this.drawTextString.style.display = "none";
                
                // Activate the draw tool
                if (toolName != "drawMilSymbol") this.drawToolbar.activate(Draw[toolName.replace("draw", "").toUpperCase()]);
                else this.drawToolbar.activate(Draw["POINT"]);
            }
            else // Text drawing tool
            {
                // Deactivate normal drawing tools
                this.drawToolbar.deactivate();
                
                // Show the text font buttons (css: display:, so it doesn't take up space)
                this.drawFontDiv.style.display = "";
                this.drawTextString.style.display = "";
                
                // Create the add text tooltip
                this.tooltip = domConstruct.create("div", { "class": "tooltip", "innerHTML": "Click to add text" }, this.map.container);
                this.tooltip.style.position = "fixed";
                
                // Allow this. to be used in the events scope
                var _this = this;
                
                // Move the add text tooltip
                var toolFunc = on(this.map, "mouse-move", function(evt, $_this){
                    var px, py;        
                    if (evt.clientX || evt.pageY) {
                        px = evt.clientX;
                        py = evt.clientY;
                    } else {
                        px = evt.clientX + win.body().scrollLeft - win.body().clientLeft;
                        py = evt.clientY + win.body().scrollTop - win.body().clientTop;
                    }
                    _this.tooltip.style.display = "none";
                    _this.tooltip.style.left = (px + 15) + "px";
                    _this.tooltip.style.top = (py) + "px";
                    _this.tooltip.style.display = "";
                    });
                
                // Remove the add text tooltip when the mouse leaves the map
                on(this.map, "mouse-out", function(evt, $_this){
                    _this.tooltip.style.display = "none";
                    });
                
                // When the map is clicked, add the text
                this.addText = on(this.map, "click", function(evt, $_this){
                    symbol = new TextSymbol(_this.drawTextString.value)
                            .setColor(new Color(_this.color))
                            .setAlign(Font.ALIGN_START)
                            .setAngle(0)
                            .setDecoration(_this.underline)
                            .setFont(new Font(_this.drawSize.value + "pt")
                            .setWeight(_this.bold)
                            .setStyle(_this.italic)
                            .setFamily("Arial"));
                    
                    // Add to the map's graphics layer
                    _this.map.graphics.add(new Graphic(new Point(evt.mapPoint), symbol));
                    
                    // Clear the drawing tool
                    _this.clearDrawingTool();
                    });
                
            }
            
        }, 
        
        
        // Creates a right click menu on map graphics
        createDrawingContextMenu: function()
        {
            
            // Allow this. to be used in the events scope
            var _this = this;
            
            var ctxMenuForGraphics = new Menu({});
            
            // Right click Edit
            var menuEdit = new MenuItem({
                label: "Edit",
                onClick: function ($_this) {
                    if (_this.selected.geometry.type !== "point") {
                        _this.editToolbar.activate(Edit.EDIT_VERTICES, _this.selected);
                    } else {
                        _this.editToolbar.activate(Edit.MOVE | Edit.EDIT_VERTICES | Edit.SCALE, _this.selected);
                    }
                    }
                });
            
            // Right click Move
            var menuMove = new MenuItem({
                label: "Move",
                onClick: function ($_this) {
                    _this.editToolbar.activate(Edit.MOVE, _this.selected);
                    }
                });
                
            // Right click Rotate/Scale
            var menuRotateScale = new MenuItem({
                label: "Rotate/Scale",
                onClick: function ($_this) {
                    _this.editToolbar.activate(Edit.ROTATE | Edit.SCALE, _this.selected);
                    }
                });
            
            // Right click Transparency popup
            var menuTransparancyPopup = new HorizontalSlider({
                name: "slider",
                id: "menuTransparancyPopup",
                value: 0,
                minimum: 0,
                maximum: 0.99,
                style: "width:150px",
                onChange: function(val, $_this) {
                    var TransVal2 = 1 - val;
                    var rt = _this.selected.symbol.color.r;
                    var gt = _this.selected.symbol.color.g;
                    var bt = _this.selected.symbol.color.b;
                    var newColor2 = [rt,gt,bt,TransVal2];
                    if (_this.selected.geometry.type == "polygon"){
                        if (_this.selected.symbol.style == "solid"){
                            symbolfill2 = SimpleFillSymbol.STYLE_SOLID;
                        } else {
                            symbolfill2 = SimpleFillSymbol.STYLE_NULL;
                        }
                            var myNumberpoly = _this.selected.symbol.outline.width;
                            var symbol2 = new SimpleFillSymbol(symbolfill2, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                            new Color(newColor2), myNumberpoly), new Color(newColor2));
                            _this.selected.setSymbol(symbol2);
                        } else if (_this.selected.symbol.type == "textsymbol"){
                            var TextAngle = _this.selected.symbol.angle;
                            var SelText = _this.selected.symbol.text;
                            var myFont2 = _this.selected.symbol.font.size;
                            var symbol2 = new TextSymbol(SelText).setColor(
                            new Color(newColor2)).setAlign(Font.ALIGN_START).setAngle(0).setDecoration(_this.underline).setFont(
                            new Font(myFont2).setWeight(_this.bold).setStyle(_this.italic).setFamily("Arial"));
                            symbol2.setAngle(TextAngle);
                            _this.selected.setSymbol(symbol2);
                        } else if (_this.selected.geometry.type == "polyline"){
                            var myNumberline = _this.selected.symbol.width;
                            var symbol2= new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(newColor2), myNumberline);
                            _this.selected.setSymbol(symbol2);
                        } else if (_this.selected.symbol.style == "circle"){
                            var myNumberpoint = _this.selected.symbol.size;
                            var symbol2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, myNumberpoint,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(newColor2), 1), new Color(newColor2));
                            _this.selected.setSymbol(symbol2);
                        }
                    }
                });
            
            // Right click Transparency 
            var menuTransparancy = new PopupMenuItem({
                label: "Transparency",
                popup: menuTransparancyPopup
                })
            
            // Right click Delete
            var menuSeparator = new MenuSeparator();
            var menuDelete = new MenuItem({
                label: "Delete",
                onClick: function ($_this) { _this.map.graphics.remove(_this.selected); }
                });
            
            ctxMenuForGraphics.startup();
            
            
            // Event for when the mouse moves over graphics
            on(this.map.graphics, "mouse-over", function (evt, $_this) {
                
                ctxMenuForGraphics.addChild(menuEdit);
                ctxMenuForGraphics.addChild(menuMove);
                ctxMenuForGraphics.addChild(menuRotateScale);
                ctxMenuForGraphics.addChild(menuTransparancy);
                ctxMenuForGraphics.addChild(menuSeparator);
                ctxMenuForGraphics.addChild(menuDelete);
                
                // Set the "selected" var with the graphic the mouse is over
                _this.selected = evt.graphic;
                
                // Set the transparancy popup value 
                dijit.byId("menuTransparancyPopup").set("value", 1 - _this.selected.symbol.color.a);
                
                // If the graphic is a point (circle symbol)
                if (_this.selected.symbol.style == "circle"){
                    ctxMenuForGraphics.removeChild(menuEdit);
                    ctxMenuForGraphics.removeChild(menuRotateScale);
                } else if (_this.selected.symbol.type == "textsymbol"){
                    ctxMenuForGraphics.removeChild(menuEdit);
                } else if (_this.selected.symbol.type == "picturemarkersymbol"){
                    ctxMenuForGraphics.removeChild(menuEdit);
                    ctxMenuForGraphics.removeChild(menuRotateScale);
                    ctxMenuForGraphics.removeChild(menuTransparancy);
                }
                
                // Let's bind to the graphic underneath the mouse cursor           
                ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
                
                
            });
            
            // Event for when the mouse moves off of graphics
            on(this.map.graphics, "mouse-out", function (evt) {
                ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
                });
            
        }, 


        // When the draw mil symbol button is clicked
        _drawMilSymbolClick: function() {
            this.changeDrawingTool("drawMilSymbol");
        },
        
        
        // When the draw point button is clicked
        _drawPointClick: function() {
            this.changeDrawingTool("drawPoint");
        },
        
        // When the draw polyline button is clicked
        _drawPolylineClick: function() {
            this.changeDrawingTool("drawPolyline");
        },
        
        // When the draw freehand polyline button is clicked
        _drawFreehand_PolylineClick: function() {
            this.changeDrawingTool("drawFreehand_Polyline");
        },
        
        // When the draw polygon button is clicked
        _drawPolygonClick: function() {
            this.changeDrawingTool("drawPolygon");
        },
        
        // When the draw freehand polygon button is clicked
        _drawFreehand_PolygonClick: function() {
            this.changeDrawingTool("drawFreehand_Polygon");
        },
        
        // When the draw circle button is clicked
        _drawCircleClick: function() {
            this.changeDrawingTool("drawCircle");
        },
        
        // When the draw ellipse button is clicked
        _drawEllipseClick: function() {
            this.changeDrawingTool("drawEllipse");
        },
        
        // When the draw text button is clicked
        _drawTextClick: function() {
            this.changeDrawingTool("drawText");
        },
        
        
        
        // Called when the color picker changes
        _colorPickerChange: function() {
            // Update the display
            popup.close(this.colorPaletteDialog);
            dom.byId("colorSwatch").style.backgroundColor = this.colorPaletteWidget.value;
            this.drawTextString.style.color = this.colorPaletteWidget.value;
            
            // Set the color and replace the a value
            var a = this.color.a;
            this.color = Color.fromHex(this.colorPaletteWidget.value)
            this.color.a = a;
        },
        
        
        // Called when the transparancy slider changes
        _transparencySliderChange: function() {
            this.drawTransparencySliderText.value = Math.round(this.drawTransparencySlider.value * 100) + "%";
            this.color.a = 1 - this.drawTransparencySlider.value;
        },
        
        
        // Called when the size spinner changes
        _sizeSpinnerChange: function() {
            this.drawTextString.style.fontSize = this.drawSize.value + "pt";
            this.drawTextString.style.lineHeight = this.drawSize.value + "pt";
        },
        
        
        // Called when the font bold button is clicked
        _fontBoldClick: function() {
            if (this.bold == Font.WEIGHT_NORMAL)
            {
                this.bold = Font.WEIGHT_BOLD;
                this.drawFontBold.className = "fontToolSelected";
                this.drawTextString.style.fontWeight = "bold";
            } else {
                this.bold = Font.WEIGHT_NORMAL;
                this.drawFontBold.className = "fontTool";
                this.drawTextString.style.fontWeight = "normal";
            }
        },
        
        
        // Called when the font underline button is clicked
        _fontUnderlineClick: function() {
            if (this.underline == "none")
            {
                this.underline = "underline";
                this.drawFontUnderline.className = "fontToolSelected";
                this.drawTextString.style.textDecoration = "underline";
            } else {
                this.underline = "none";
                this.drawFontUnderline.className = "fontTool";
                this.drawTextString.style.textDecoration = "none";
            }
        },
        
        
        // Called when the font italic button is clicked
        _fontItalicClick: function() {
            if (this.italic == Font.STYLE_NORMAL)
            {
                this.italic = Font.STYLE_ITALIC;
                this.drawFontItalic.className = "fontToolSelected";
                this.drawTextString.style.fontStyle = "italic";
            } else {
                this.italic = Font.STYLE_NORMAL;
                this.drawFontItalic.className = "fontTool";
                this.drawTextString.style.fontStyle = "normal";
            }
        },
        
        
        // Called when the solid fill checkbox changes
        _solidFillChange: function() {
            if (this.drawSolidFill) {
                this.solidfill = SimpleFillSymbol.STYLE_SOLID;
            } else {
                this.solidfill = SimpleFillSymbol.STYLE_NULL;
            }
        },
        
        // Clears all graphics
        _clearGraphic: function () {
            this.map.graphics.clear();
        },
        
        
        // Coding Scheme select change
        _changeSIDCCODINGSCHEME: function() {
            // onchange="battledimensionValues();functionIdValues();changeSymbol()"
            milSymbolCodeGenerator.battledimensionValues();
            milSymbolCodeGenerator.functionIdValues();
            this._refreshMilSymbolPreview();
        },
        
        // Affiliation select change
        _changeSIDCAFFILIATION: function() {
            // onchange="changeSymbol()"
            this._refreshMilSymbolPreview();
        },
        
        // Battle Dimension select change
        _changeSIDCBATTLEDIMENSION: function() {
            // onchange="functionIdValues();changeSymbol()"
            milSymbolCodeGenerator.functionIdValues();
            this._refreshMilSymbolPreview();
        },
        
        // Status select change
        _changeSIDCSTATUS: function() {
            // onchange="battledimensionValues();functionIdValues();changeSymbol()"
            milSymbolCodeGenerator.functionIdValues();
            this._refreshMilSymbolPreview();
        },
        
        // Function ID select change
        _changeSIDCFUNCTIONID: function() {
            // onchange="changeSymbol()"
            this._refreshMilSymbolPreview();
        },
        
        // Symbol Modifier 2 select change
        _changeSIDCSYMBOLMODIFIER11: function() {
            //  onchange="modifier12Values();functionIdValues();changeSymbol()"
            milSymbolCodeGenerator.functionIdValues();
            this._refreshMilSymbolPreview();
        },
        
        // Symbol Modifier 2 select change
        _changeSIDCSYMBOLMODIFIER12: function() {
            //  onchange="changeSymbol()"
            this._refreshMilSymbolPreview();
        },
        
        
        // gets the SIDC string
        _getCurrentSIDC: function() {
            // Get each part of the string
            var SIDCCODINGSCHEME= document.getElementById('SIDCCODINGSCHEME').value;//document.getElementById("SIDCCODINGSCHEME")[document.getElementById("SIDCCODINGSCHEME").selectedIndex].value;
            var SIDCAFFILIATION= document.getElementById("SIDCAFFILIATION")[document.getElementById("SIDCAFFILIATION").selectedIndex].value;
            var SIDCBATTLEDIMENSION= document.getElementById("SIDCBATTLEDIMENSION")[document.getElementById("SIDCBATTLEDIMENSION").selectedIndex].value;
            var SIDCSTATUS= document.getElementById("SIDCSTATUS")[document.getElementById("SIDCSTATUS").selectedIndex].value;
            var SIDCFUNCTIONID = document.getElementById("SIDCFUNCTIONID")[document.getElementById("SIDCFUNCTIONID").selectedIndex].value;
            var SIDCSYMBOLMODIFIER11= document.getElementById("SIDCSYMBOLMODIFIER11")[document.getElementById("SIDCSYMBOLMODIFIER11").selectedIndex].value;
            var SIDCSYMBOLMODIFIER12= document.getElementById("SIDCSYMBOLMODIFIER12")[document.getElementById("SIDCSYMBOLMODIFIER12").selectedIndex].value;
            
            return SIDCCODINGSCHEME + SIDCAFFILIATION + SIDCBATTLEDIMENSION + SIDCSTATUS + SIDCFUNCTIONID + SIDCSYMBOLMODIFIER11 + SIDCSYMBOLMODIFIER12// +  " ** *";
        },
        
        
        // Gets and Refreshes the preview of the mil symbol
        _refreshMilSymbolPreview: function() {
            // Get the SIDC
            var SIDC = this._getCurrentSIDC();
            this.SIDCSpan.innerHTML = SIDC;
            
            // Create the marker
            var ms = new MS.symbol(SIDC);
            ms.size = this.drawMilSymbolSize.value;
            
            // Add text modifiers
            ms.quantity = this.FieldC.value;
            ms.reinforcedReduced = this.FieldF.value;
            ms.staffComments = this.FieldG.value;
            ms.additionalInformation = this.FieldH.value;
            ms.evaluationRating = this.FieldJ.value;
            ms.combatEffectiveness = this.FieldK.value;
            ms.signatureEquipment = this.FieldL.value;
            ms.higherFormation = this.FieldM.value;
            ms.hostile = this.FieldN.value;
            ms.iffSif = this.FieldP.value;
            ms.direction = this.FieldQ.value;
            ms.uniqueDesignation = this.FieldT.value;
            ms.type = this.FieldV.value;
            ms.dtg = this.FieldW.value;
            ms.altitudeDepth = this.FieldX.value;
            ms.location = this.FieldY.value;
            ms.speed = this.FieldZ.value;
            ms.specialHeadquarters = this.FieldAA.value;
            
            this.milSymbolMarker = ms.getMarker();
            
            // Set the src and size
            this.previewMilSymbol.src = "data:image/svg+xml;base64," + Base64.encode(this.milSymbolMarker.XML);
            this.previewMilSymbol.style.height = this.milSymbolMarker.height + "px";
            this.previewMilSymbol.style.width = this.milSymbolMarker.width + "px";
            
            // Limit the preview size so it doesn't fall out of the div
            if (this.milSymbolMarker.height > 40)
            {
                this.previewMilSymbol.style.height = 40 + "px";
                this.previewMilSymbol.style.width = ((40 / this.milSymbolMarker.height) * this.milSymbolMarker.width) + "px";
            }
            
        },
        
        // Creates a Miltary Symbol as an ESRI PictureMarkerSymbol object
        _createMilSymbol: function()
        {
            // Make the symbol
            var markerURL = "data:image/svg+xml;base64," + Base64.encode(this.milSymbolMarker.XML);
            var symbol = new PictureMarkerSymbol(markerURL, this.milSymbolMarker.width, this.milSymbolMarker.height);
            
            return symbol;
        }
        
        
        
    });

});