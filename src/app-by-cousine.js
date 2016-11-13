(function () {
    window.current_nodes = [];

    var update = function (source) {
        var nodes = tree.nodes(root).reverse();
        var links = tree.links(nodes);

        nodes.forEach(function (d) {
            return d.y = d.depth * 130;
        });

        var node = svg.selectAll('g.node').data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        var nodeEnter = node.enter().append('g')
                            .attr('class', 'node')
                            .attr('transform',
                                function (d) {},
                                {},
                                'translate(' + source.y0 + ',' + source.x0 + ')')
                            .on('mouseover',
                                function (d) {})
                            .on('click',
                                function (d) {
                                    var clicked_same_node = false;
                                    if (window.current_nodes.length > 0) {
                                        if (d.id === window.current_nodes[window.current_nodes.length - 1][0].id) {
                                            clicked_same_node = true;
                                            d3.event.stopPropagation();
                                        }
                                    }
                                    if (!clicked_same_node) {
                                        return store_and_update(d);
                                    }
                                });

        nodeEnter
            .append('circle')
            .attr('r', 0.000001)
            .style('fill', function (d) {
                if (d._children) {
                    return 'lightsteelblue';
                } else {
                    return '#fff';
                }
            });
        nodeEnter
            .append('text')
            .attr('dy', '.31em')
            .attr('text-anchor', function (d) {
                if (d.x < 180) {
                    return 'start';
                } else {
                    return 'end';
                }
            }).attr('transform', function (d) {
                if (d.x < 180) {
                    return 'translate(8)';
                } else {
                    return 'rotate(180)translate(-8)';
                }
            }).text(function (d) {
                return d.name;
            });

        var nodeUpdate = node.transition().duration(duration)
            .attr('transform', function (d) {
                return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')';
            });

        var colors = ['#EF946C', '#C4A77D', '#70877F', '#7EBC89','#2F2963',
                      '#FE5D26', '#F2C078', '#454372', '#297373', '#764134'];

        nodeUpdate.select('circle')
            .attr('r', 4)
            .style('fill', function (d) {
                if (d.name.indexOf('Cousines') >= 0){
                    return 'black';
                }
                if (d.name.indexOf('Topic') >= 0) {
                    return colors[parseInt(d.name.split(' ') [1])];
                }

                return colors[parseInt(d.parent.name.split(' ') [1])];
            })
            .style('fill-opacity', function(d){
                if(d.weight){
                    return d.weight * 120;
                }
                return 1;
            });

        nodeUpdate.select('text').style('fill-opacity', 1).attr('dy', '.31em').attr('text-anchor', function (d) {
            if (d.x < 180) {
                return 'start';
            } else {
                return 'end';
            }
        }).attr('transform', function (d) {
            if(d.name.indexOf('Sample') >= 0 || d.name.indexOf('Topic') >= 0){
                if (d.x < 180) {
                    return 'translate(-40)';
                } else {
                    return 'rotate(180)translate(40)';
                }
            }
            if (d.x < 180) {
                return 'translate(8)';
            } else {
                return 'rotate(180)translate(-8)';
            }
        });

        var nodeExit = node.exit().transition().duration(duration).attr('transform', function (d) {
            return 'translate(' + source.y + ',' + source.x + ')';
        }).remove();
        nodeExit.select('circle').attr('r', 0.000001);
        nodeExit.select('text').style('fill-opacity', 0.000001);
        var link = svg.selectAll('path.link').data(links, function (d) {
            return d.target.id;
        });
        link.enter().insert('path', 'g').attr('class', 'link').attr('d', function (d) {
            var o;
            o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });
        link.transition().duration(duration).attr('d', diagonal);
        link.exit().transition().duration(duration).attr('d', function (d) {
            var o;
            o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        }).remove();
        return nodes.forEach(function (d) {
            d.x0 = d.x;
            return d.y0 = d.y;
        });
    };
    var construct_generations = function (d) {
        var c, generations;
        c = d;
        generations = [];
        while (c.parent) {
            generations.push(c.parent.children);
            c = c.parent;
        }
        return generations;
    };
    var reform_focus = function () {
        var count, d, set;
        if (window.current_nodes.length > 0) {
            set = window.current_nodes.pop();
            d = set[0];
            count = 0;
            d.parent._children = set[1];
            if (d.parent._children) {
                while (d.parent) {
                    d.parent.children = set[1][count];
                    count++;
                    d = d.parent;
                }
                return update(d);
            }
        }
    };
    var store_and_update = function (d) {
        window.current_nodes.push([
            d,
            construct_generations(d)
        ]);
        while (d.parent) {
            d.parent._children = d.parent.children;
            d.parent.children = [_.find(d.parent.children, function (e) {
                    return e.name === d.name;
                })];
            d = d.parent;
        }
        d3.event.stopPropagation();
        return update(d);
    };
    var reconstruct_ancestors = function (n, generations) {
        var count;
        count = generations.length - 1;
        while (n.parent) {
            n.parent.children = generations[count];
            count -= 1;
            n = n.parent;
        }
        return n;
    };

    $('body').click(function () {
        return reform_focus();
    });

    var diameter = 720;
    var height = diameter - 150;
    var radius = diameter / 2;
    var root = void 0;
    var tree = d3.layout.tree().size([
        360,
        radius - 120
    ]);

    var i = 0;
    var duration = 2000;
    var diagonal = d3.svg.diagonal.radial().projection(function (d) {
        return [
            d.y,
            d.x / 180 * Math.PI
        ];
    });
    var zoom = function () {
        return svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    };

    var svg = d3.select('svg')
    .attr('viewbox', '0 0 ' + diameter / 2 + ',' + diameter / 2)
    .attr('width', '1800px')
    .attr('height', '100%')
    .append('g')
    .attr('transform', 'translate(' + ((diameter / 2)+200)  + ',' + ((diameter / 2)+140)  + ')')
    .append('g').call(d3.behavior.zoom().scaleExtent([
        1,
        8
    ]).on('zoom', zoom));


    d3.json("src/dataset-by-cousine.json", function(error, data) {
      if (error) throw error;

      root = data;

      root.x0 = height / 2;
      root.y0 = 0;
      update(root);
    });
}.call(this));