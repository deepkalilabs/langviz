function createChart(data) {
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 500;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 20;
  const marginLeft = 40;

  // Determine the series that need to be stacked.
  const series = d3.stack()
      .keys(d3.union(data.map(d => d.age))) // distinct series keys, in input order
      .value(([, D], key) => D.get(key).population) // get value for each series key and stack
    (d3.index(data, d => d.state, d => d.age)); // group by stack then series key

  // Prepare the scales for positional and color encodings.
  const x = d3.scaleBand()
      .domain(d3.groupSort(data, D => -d3.sum(D, d => d.population), d => d.state))
      .range([marginLeft, width - marginRight])
      .padding(0.1);

  const y = d3.scaleLinear()
      .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
      .rangeRound([height - marginBottom, marginTop]);

  const color = d3.scaleOrdinal()
      .domain(series.map(d => d.key))
      .range(d3.schemeSpectral[series.length])
      .unknown("#ccc");

  // A function to format the value in the tooltip.
  const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  // Append a group for each series, and a rect for each element in the series.
  svg.append("g")
    .selectAll()
    .data(series)
    .join("g")
      .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(D => D.map(d => (d.key = D.key, d)))
    .join("rect")
      .attr("x", d => x(d.data[0]))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
    .append("title")
      .text(d => `${d.data[0]} ${d.key}\n${formatValue(d.data[1].get(d.key).population)}`);

  // Append the horizontal axis.
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call(g => g.selectAll(".domain").remove());

  // Append the vertical axis.
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call(g => g.selectAll(".domain").remove());

  // Return the chart with the color scale as a property (for the legend).
  return svg.node();
}