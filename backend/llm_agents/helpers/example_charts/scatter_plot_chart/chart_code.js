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
    .domain(d3.extent(data, d => d.sepalLength)).nice()
    .range([marginLeft, width - marginRight]);
  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.sepalWidth)).nice()
    .range([height - marginBottom, marginTop]);

  // Create the categorical scales.
  const color = d3.scaleOrdinal(data.map(d => d.species), d3.schemeCategory10);
  const shape = d3.scaleOrdinal(data.map(d => d.species), d3.symbols.map(s => d3.symbol().type(s)()));

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
          .text("Sepal length (cm) →"));

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("↑ Sepal width (cm)"));

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
    .selectAll("path")
    .data(data)
    .join("path")
      .attr("transform", d => `translate(${x(d.sepalLength)},${y(d.sepalWidth)})`)
      .attr("fill", d => color(d.species))
      .attr("d", d => shape(d.species));

  return svg.node();
}
