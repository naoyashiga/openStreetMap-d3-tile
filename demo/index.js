const d3 = require("d3")
const Tile = require("d3-tile")

const pi = Math.PI
const tau = 2 * pi

const location = {
  latitude: 35.658581,
  longitude: 139.745433
}

const locationsCount = 100

const locations = d3.range(locationsCount).map(() => {

  const wiggleScale = 0.01
  const lng = location.longitude + wiggle(wiggleScale)
  const lat = location.latitude + wiggle(wiggleScale)

  return {
    type: "Feature",
    geometry: {type: "Point", coordinates: [+lng, +lat]}
  }

})

function wiggle(scale) {
  return d3.randomNormal()() * scale
}

function stringify(scale, translate) {
  const k = scale / 256, r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}


class Viz {
  constructor() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.projection = this.createProjection()
    this.path = d3.geoPath()
    .projection(this.projection)
    .pointRadius(2)

    this.tile = Tile.tile()
    .size([this.width, this.height])

    this.zoom = d3.zoom()
    .on('zoom', this.zoomed.bind(this))

    this.svg = this.createScreen()

    this.raster = this.svg.append('g')
    this.vector = this.svg.append('path')

    this.loadData()

  }

  loadData() {
    const center = this.projection([location.longitude, location.latitude])

    this.vector.datum({type: "FeatureCollection", features: locations})

    this.svg
      .call(this.zoom)
      .call(this.zoom.transform, d3.zoomIdentity
          .translate(this.width / 2, this.height / 2)
          .scale(1 << 22)
          .translate(-center[0], -center[1]));
  }

  zoomed() {
    const transform = d3.event.transform

    const tiles = this.tile.scale(transform.k)
    .translate([transform.x, transform.y])()

    const image = this.raster
    .attr('transform', stringify(tiles.scale, tiles.translate))
    .selectAll('image')
    .data(tiles, function(d) { return d;})

    const imageSize = 256

    image.exit().remove()

    image.enter().append('image')
    .attr("xlink:href", (d) => {
      return "http://www.toolserver.org/tiles/bw-mapnik/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";

      // return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
      .attr("x", (d) => (d[0] * imageSize))
      .attr("y", (d) => (d[1] * imageSize))
      .attr("width", imageSize)
      .attr("height", imageSize);

    this.projection.scale(transform.k / tau)
    .translate([transform.x, transform.y])

    this.vector.attr('d', this.path)
  }

  createProjection() {
    return d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0])
  }

  createScreen() {
    return d3.select('body')
    .append('svg')
    .attr('width', this.width)
    .attr('height', this.height)
  }

}

new Viz()
