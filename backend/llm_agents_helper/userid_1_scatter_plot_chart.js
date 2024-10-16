function createChart(data) {
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 600;
  const marginTop = 25;
  const marginRight = 20;
  const marginBottom = 35;
  const marginLeft = 40;

  // Create the positional scales.
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Engine_Size__l_)).nice()
    .range([marginLeft, width - marginRight]);
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Highway_Miles_Per_Gallon)).nice()
    .range([height - marginBottom, marginTop]);

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");

  // Append the axes.
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", width)
          .attr("y", marginBottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("Engine Size (L) →"));

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Highway MPG"));

  // Add a grid.
  svg.append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call(g => g.append("g")
        .selectAll("line")
        .data(x.ticks())
        .join("line")
          .attr("x1", d => 0.5 + x(d))
          .attr("x2", d => 0.5 + x(d))
          .attr("y1", marginTop)
          .attr("y2", height - marginBottom))
      .call(g => g.append("g")
        .selectAll("line")
        .data(y.ticks())
        .join("line")
          .attr("y1", d => 0.5 + y(d))
          .attr("y2", d => 0.5 + y(d))
          .attr("x1", marginLeft)
          .attr("x2", width - marginRight));

  // Add the scatterplot symbols.
  svg.append("g")
      .attr("stroke-width", 1.5)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x(d.Engine_Size__l_))
      .attr("cy", d => y(d.Highway_Miles_Per_Gallon))
      .attr("r", 3)
      .attr("fill", "currentColor");

  return svg.node;
}