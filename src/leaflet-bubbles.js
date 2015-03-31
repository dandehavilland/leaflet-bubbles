/*
 (c) 2014, Dan de Havilland
 leaflet-bubbles, a simple bubble overlay for Leaflet.JS
 https://github.com/dandehavilland/leaflet-bubbles
*/

L.BubbleLayer = (L.Layer ? L.Layer : L.Class).extend({

  // options: {
  //   minOpacity: 0.05,
  //   maxZoom: 18,
  //   radius: 25,
  //   blur: 15,
  //   max: 1.0
  // },

  initialize: function (features, options) {
    this._features = features;
    L.setOptions(this, options);
  },

  setFeatures: function (features) {
    this._features = features;
    return this.redraw();
  },

  onAdd: function (map) {
    this._map = map;

    if (!this._svg) {
      this._initSVG();
    }

    map.on('moveend zoomend', this._reset, this);
    this._reset();
  },

  onRemove: function (map) {
    d3.select(this._svg).remove();
    this._svg = null;

    map.off('moveend zoomend', this._reset, this);
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _initSVG: function () {
    var svg = this._svg = d3.select(this._map._panes.overlayPane)
      .append('svg')
      .classed('leaflet-bubble-layer leaflet-zoom-hide', true)
      .node();

    var container = this._container = d3.select(svg)
      .append('g')
      .classed('leaflet-bubbles', true)
      .node();

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;

    L.DomUtil.addClass(svg, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
  },

  /**
    Repositions and resizes the containing SVG
  */
  _reset: function () {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);

    var size = this._map.getSize();
    d3.select(this._svg).attr('width', size.x);
    d3.select(this._svg).attr('height', size.y);

    this._redraw();
  },

  redraw: function() {
    if (this._map) {
      this._redraw();
    }
  },

  /**
    Update the bubble sizes and positions
  */
  _redraw: function () {
    var data = this._features,
      context = this,
      svg = d3.select(this._svg),
      container = d3.select(this._container),
      join = container.selectAll('circle.bubble').data(data),
      bounds = this._map.getBounds(),
      extent = d3.extent(data, function(d) { return d[2]; }),
      range = d3.scale.linear().domain(extent).range([0, this.options.maxRadius]),
      northWest = bounds.getNorthWest(),
      topLeft = this._applyLatLngToLayer(northWest.lng, northWest.lat),
      southEast = bounds.getSouthEast(),
      bottomRight = this._applyLatLngToLayer(southEast.lng, southEast.lat),
    bubbles;

    container.attr('transform', 'translate('+ -topLeft.x +', '+ -topLeft.y +')');

    svg.attr({
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    }).style({
      left: topLeft.x + 'px',
      top: topLeft.y + 'px'
    });

    join.exit();

    bubbles = join.enter()
      .append('circle')
      .classed('bubble', true);

    container.selectAll('circle.bubble')
      .attr({
        cx: function(d) {
          return context._applyLatLngToLayer(d[1], d[0]).x;
        },
        cy: function(d) {
          return context._applyLatLngToLayer(d[1], d[0]).y;
        }
      })
      // .transition().duration(500)
      .attr('r', function(d) {
        return range(d[2]);
      });

    this._frame = null;
  },

  _applyLatLngToLayer: function(x, y) {
    return this._map.latLngToLayerPoint(new L.LatLng(y, x));
  }
});

L.bubbleLayer = function (latlngs, options) {
  return new L.BubbleLayer(latlngs, options);
};
