function createChart(data) {
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 600;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 20;
  const marginLeft = 40;

  // Prepare the scales for positional and color encodings.
  // Fx encodes the state.
  const fx = d3.scaleBand()
      .domain(new Set(data.map(d => d.state)))
      .rangeRound([marginLeft, width - marginRight])
      .paddingInner(0.1);

  // Both x and color encode the age class.
  const ages = new Set(data.map(d => d.age));

  const x = d3.scaleBand()
      .domain(ages)
      .rangeRound([0, fx.bandwidth()])
      .padding(0.05);

  const color = d3.scaleOrdinal()
      .domain(ages)
      .range(d3.schemeSpectral[ages.size])
      .unknown("#ccc");

  // Y encodes the height of the bar.
  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.population)]).nice()
      .rangeRound([height - marginBottom, marginTop]);

  // A function to format the value in the tooltip.
  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  // Append a group for each state, and a rect for each age.
  svg.append("g")
    .selectAll()
    .data(d3.group(data, d => d.state))
    .join("g")
      .attr("transform", ([state]) => `translate(${fx(state)},0)`)
    .selectAll()
    .data(([, d]) => d)
    .join("rect")
      .attr("x", d => x(d.age))
      .attr("y", d => y(d.population))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.population))
      .attr("fill", d => color(d.age));

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
  return svg.node();
}
