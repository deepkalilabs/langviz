function createVehicleChart(data) {
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 600;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 20;
  const marginLeft = 40;

  // Prepare the scales for positional and color encodings.
  const fx = d3.scaleBand()
      .domain(data.map(d => d.Type))
      .rangeRound([marginLeft, width - marginRight])
      .paddingInner(0.1);

  const x = d3.scaleBand()
      .domain(data.map(d => d.Type))
      .rangeRound([0, fx.bandwidth()])
      .padding(0.05);

  const color = d3.scaleOrdinal()
      .domain(data.map(d => d.Type))
      .range(d3.schemeCategory10)
      .unknown("#ccc");

  // Y encodes the height of the bar.
  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.City_Miles_Per_Gallon)]).nice()
      .rangeRound([height - marginBottom, marginTop]);

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  // Append a group for each vehicle type, and a rect for each vehicle.
  svg.append("g")
    .selectAll()
    .data(data)
    .join("rect")
      .attr("x", d => fx(d.Type))
      .attr("y", d => y(d.City_Miles_Per_Gallon))
      .attr("width", fx.bandwidth())
      .attr("height", d => y(0) - y(d.City_Miles_Per_Gallon))
      .attr("fill", d => color(d.Type));

  // Append the horizontal axis.
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(fx).tickSizeOuter(0))
      .call(g => g.selectAll(".domain").remove());

  // Append the vertical axis.
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove());

  // Return the chart with the color scale as a property (for the legend).
  return Object.assign(svg.node(), {scales: {color}});
}