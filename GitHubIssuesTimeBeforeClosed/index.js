const DAY = 24 * 60 * 60 * 1000;
class Issue {
    constructor(created, closed) {
        this.created = d3.isoParse(created);
        this.openPeriod = closed == null ? null : ((d3.isoParse(closed) - this.created) / DAY);
        this.createdAligned = d3.utcWeek.floor(this.created);
    }
}

async function render(path) {
    var issues = await d3.json(path);
    issues = issues.map(issue => new Issue(issue[0], issue[1]));

    const margin = {top: 20, right: 50, bottom: 30, left: 20},
        width = 1400 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const now = Date.now();
    const earliestWeek = d3.min(issues.map(i => i.createdAligned));
    const x = d3.scaleTime()
          .domain([earliestWeek, now])
          .range([0, width])
          .nice();

    const earliestCreated = d3.min(issues.map(i => i.created));
    const colorScale = d3.scaleLog()
          .domain([(Date.now() - earliestCreated) / DAY, 1])
          .range([100, 230])
          .clamp(true);
    console.log(earliestCreated);
    console.log(Date.now() - earliestCreated);

    const maxCreatedPerWeek = d3.max(d3.rollups(issues, v => v.length, d => d.createdAligned.toString()).map(d => d[1]));
    const issueHeight = Math.floor(height / maxCreatedPerWeek);
    const createdPerWeek = d3.rollups(
        issues,
        v => {
            v.sort((i, j) => {
                if (i.openPeriod === null) {
                    return -1;
                }
                if (j.openPeriod == null) {
                    return 1;
                }
                return j.openPeriod - i.openPeriod;
            });
            v.reduce((acc, cur, i, arr) => {
                arr[i].y = acc;
                arr[i].x = x(arr[i].createdAligned);
                acc += issueHeight;
                return acc;
            }, 0);
            return v;
        },
        d => d.createdAligned.toUTCString()
    ).map(d => d[1]);

    var y = d3.scaleLinear()
        .domain([0, maxCreatedPerWeek])
        .range([height, 0])
        .nice();

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
        .call(d3.axisBottom(x).ticks());

    debugger;
    var issueWidth = Math.floor(width / Math.floor((now - earliestWeek) / (DAY * 7)));
    if (issueWidth > 10) {
        issueWidth -= 2;
    } else if (issueWidth > 2) {
        issueWidth -= 1;
    }
    svg.append("g")
        .selectAll("rect")
        .data(createdPerWeek.flat())
        .enter()
        .append("rect")
        .attr("x", d => d.x)
        .attr("height", issueHeight)
        .attr("width", issueWidth)
        .attr("issue", d => JSON.stringify(d))
        .attr("fill", d => {
            var color = d.openPeriod == null ? 50 : colorScale(d.openPeriod);
            return "rgb(" + color + "," + color + "," + color + ")";
        })
        .attr("transform", d => ("translate(" + margin.left + "," + (height + margin.top - issueHeight - d.y)) + ")");
}

// render('nteract-semiotic.json');
// render('librosa-librosa.json');
// render('jupyterlab-jupyterlab.json');
render('pandas-dev-pandas.json');
