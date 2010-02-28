var guid = 0;

pv.SvgScene.panel = function(scenes) {
  var g = scenes.$g, e = g && g.firstChild;
  for (var i = 0; i < scenes.length; i++) {
    var s = scenes[i];

    /* visible */
    if (!s.visible) continue;

    /* svg */
    if (!scenes.parent) {
      s.canvas.style.display = "inline-block";
      if (g && (g.parentNode != s.canvas)) {
        g = s.canvas.firstChild;
        e = g && g.firstChild;
      }
      if (!g) {
        g = this.create("svg");
        g.setAttribute("font-size", "10px");
        g.setAttribute("font-family", "sans-serif");
        g.setAttribute("fill", "none");
        g.setAttribute("stroke", "none");
        g.setAttribute("stroke-width", 1.5);
        g.style.display = "inline-block";

        if (pv.renderer() == "svgweb") { // SVGWeb requires a separate mechanism for setting event listeners.
            // width/height can't be set on the fragment
            g.setAttribute("width", s.width + s.left + s.right);
            g.setAttribute("height", s.height + s.top + s.bottom);

            var frag = document.createDocumentFragment(true);

            g.addEventListener('SVGLoad', function() {
                this.appendChild(frag);
                this.addEventListener ('click', pv.SvgScene.dispatch, true);
                this.addEventListener ('mousedown', pv.SvgScene.dispatch, true);
                this.addEventListener ('mouseup', pv.SvgScene.dispatch, true);
                this.addEventListener ('mouseout', pv.SvgScene.dispatch, true);
                this.addEventListener ('mouseover', pv.SvgScene.dispatch, true);
                this.addEventListener ('mousemove', pv.SvgScene.dispatch, true);
                scenes.$g = this;
            }, false);

            svgweb.appendChild (g, s.canvas);
            g = frag;
        } else {
            g.onclick
                = g.onmousedown
                = g.onmouseup
                = g.onmousemove
                = g.onmouseout
                = g.onmouseover
                = g.onmousewheel
                = this.dispatch;
            g = s.canvas.appendChild(g);
        }

        e = g.firstChild;
      }
      scenes.$g = g;
      if (pv.renderer() != 'svgweb') {
        g.setAttribute("width", s.width + s.left + s.right);
        g.setAttribute("height", s.height + s.top + s.bottom);
      }
    }

    /* clip (nest children) */
    if (s.overflow == "hidden") {
      var id = (guid++).toString(36),
          c = this.expect(e, "g", {"clip-path": "url(#" + id + ")"});
      if (!c.parentNode) g.appendChild(c);
      scenes.$g = g = c;
      e = c.firstChild;

      e = this.expect(e, "clipPath", {"id": id});
      var r = e.firstChild || e.appendChild(this.create("rect"));
      r.setAttribute("x", s.left);
      r.setAttribute("y", s.top);
      r.setAttribute("width", s.width);
      r.setAttribute("height", s.height);
      if (!e.parentNode) g.appendChild(e);
      e = e.nextSibling;
    }

    /* fill */
    e = this.fill(e, scenes, i);

    /* transform (push) */
    var k = this.scale,
        t = s.transform,
        x = s.left + t.x,
        y = s.top + t.y;
    this.scale *= t.k;

    /* children */
    for (var j = 0; j < s.children.length; j++) {
      s.children[j].$g = e = this.expect(e, "g", {
          "transform": "translate(" + x + "," + y + ")"
              + (t.k != 1 ? " scale(" + t.k + ")" : "")
        });
      this.updateAll(s.children[j]);
      if (!e.parentNode) g.appendChild(e);
      e = e.nextSibling;
    }

    /* transform (pop) */
    this.scale = k;

    /* stroke */
    e = this.stroke(e, scenes, i);

    /* clip (restore group) */
    if (s.overflow == "hidden") {
      scenes.$g = g = c.parentNode;
      e = c.nextSibling;
    }
  }
  return e;
};

pv.SvgScene.fill = function(e, scenes, i) {
  var s = scenes[i], fill = s.fillStyle;
  if (fill.opacity) {
    e = this.expect(e, "rect", {
        "shape-rendering": s.antialias ? null : "crispEdges",
        "cursor": s.cursor,
        "x": s.left,
        "y": s.top,
        "width": s.width,
        "height": s.height,
        "fill": fill.color,
        "fill-opacity": fill.opacity,
        "stroke": null
      });
    e = this.append(e, scenes, i);
  }
  return e;
};

pv.SvgScene.stroke = function(e, scenes, i) {
  var s = scenes[i], stroke = s.strokeStyle;
  if (stroke.opacity) {
    e = this.expect(e, "rect", {
        "shape-rendering": s.antialias ? null : "crispEdges",
        "cursor": s.cursor,
        "x": s.left,
        "y": s.top,
        "width": Math.max(1E-10, s.width),
        "height": Math.max(1E-10, s.height),
        "fill": null,
        "stroke": stroke.color,
        "stroke-opacity": stroke.opacity,
        "stroke-width": s.lineWidth / this.scale
      });
    e = this.append(e, scenes, i);
  }
  return e;
};
