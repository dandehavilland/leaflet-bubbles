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

  setOptions: function (options) {
    L.setOptions(this, options);
    return this.redraw();
  },

  redraw: function () {
    if (this._map && !this._frame && !this._map._animating) {
      this._frame = L.Util.requestAnimFrame(this._redraw, this.options);
    }
    return this;
  },

  onAdd: function (map) {
    this._map = map;

    if (!this._svg) {
      this._initSVG();
    }

    // map._panes.overlayPane.appendChild(this._svg);

    map.on('moveend', this._reset, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove: function (map) {
    d3.select(this._svg).remove();
    this._svg = null;

    map.off('moveend', this._reset, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _initSVG: function () {
    var svg = this._svg = d3.select(this._map._panes.overlayPane)
      .append('svg')
      .classed('leaflet-bubble-layer', true)
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
    L.DomUtil.setPosition(this._svg, topLeft);

    var size = this._map.getSize();
    d3.select(this._svg).attr('width', size.x);
    d3.select(this._svg).attr('height', size.y);

    this._redraw();
  },

  /**
    Update the bubble sizes and positions
  */
  _redraw: function () {
    var data = this._features,
      context = this,
      container = d3.select(this._container),
      join = container.selectAll('circle.bubble').data(data),
      bounds = this._map.getBounds(),
      extent = d3.extent(data, function(d) { return d[2]; }),
      range = d3.scale.linear().domain(extent).range([0, this.options.maxRadius]),
      northWest = bounds.getNorthWest(),
      topLeft = this._applyLatLngToLayer(northWest.lng, northWest.lat),
      bubbles;

    container.attr('transform', 'translate('+ -topLeft.x +', '+ -topLeft.y +')');

    join.exit();

    bubbles = join.enter()
      .append('circle')
      .classed('bubble', true);

    bubbles.attr({
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
  },

  _animateZoom: function (e) {
    var scale = this._map.getZoomScale(e.zoom),
      offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    if (L.DomUtil.setTransform) {
       L.DomUtil.setTransform(this._svg, offset, scale);

    } else {
      this._svg.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    }
  }
});

L.bubbleLayer = function (latlngs, options) {
  return new L.BubbleLayer(latlngs, options);
};
