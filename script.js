// List of tracked players with prop thresholds
const trackedPlayers = [
    {name: "LeBron James", id: 237, props: {pts: 27, reb: 8, ast: 8}},
    {name: "Stephen Curry", id: 115, props: {pts: 30, reb: 5, ast: 6}},
    {name: "Giannis Antetokounmpo", id: 15, props: {pts: 28, reb: 12, ast: 6}}
];

const playerSelect = document.getElementById("playerSelect");
trackedPlayers.forEach((p, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = p.name;
    playerSelect.appendChild(option);
});

// Function to fetch last 5 games and calculate stats
async function fetchPlayerStats(player) {
    const res = await fetch(`https://www.balldontlie.io/api/v1/stats?player_ids[]=${player.id}&per_page=5`);
    const data = await res.json();
    const last5 = data.data.reverse(); // oldest first

    const avgPts = (last5.reduce((sum, g) => sum + g.pts, 0)/last5.length).toFixed(1);
    const avgReb = (last5.reduce((sum, g) => sum + g.reb, 0)/last5.length).toFixed(1);
    const avgAst = (last5.reduce((sum, g) => sum + g.ast, 0)/last5.length).toFixed(1);

    const hitPts = Math.round(last5.filter(g => g.pts >= player.props.pts).length / last5.length * 100);
    const hitReb = Math.round(last5.filter(g => g.reb >= player.props.reb).length / last5.length * 100);
    const hitAst = Math.round(last5.filter(g => g.ast >= player.props.ast).length / last5.length * 100);

    return {avgPts, avgReb, avgAst, hitPts, hitReb, hitAst, last5};
}

// Update table and chart for selected player
async function updatePlayer() {
    const player = trackedPlayers[playerSelect.value];
    const stats = await fetchPlayerStats(player);

    // Update table
    const tbody = document.querySelector("#statsTable tbody");
    tbody.innerHTML = `
        <tr>
            <td>${player.name}</td>
            <td>${stats.last5[0]?.team.abbreviation || ""}</td>
            <td>${stats.avgPts}</td>
            <td>${stats.avgReb}</td>
            <td>${stats.avgAst}</td>
            <td>${stats.hitPts}%</td>
            <td>${stats.hitReb}%</td>
            <td>${stats.hitAst}%</td>
        </tr>
    `;

    // Chart: last 5 games stats
    const ctx = document.getElementById("statsChart").getContext("2d");
    if(window.statsChart) window.statsChart.destroy(); // remove old chart
    window.statsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Game 1","Game 2","Game 3","Game 4","Game 5"],
            datasets: [
                {label:"Points", data: stats.last5.map(g=>g.pts), borderColor:"red", fill:false, tension:0.3},
                {label:"Rebounds", data: stats.last5.map(g=>g.reb), borderColor:"blue", fill:false, tension:0.3},
                {label:"Assists", data: stats.last5.map(g=>g.ast), borderColor:"green", fill:false, tension:0.3}
            ]
        },
        options: {responsive:true, plugins:{legend:{position:"top"}, title:{display:true,text:`Last 5 Games Stats - ${player.name}`}}, scales:{y:{beginAtZero:true}}}
    });
}

// Load first player by default
updatePlayer();
playerSelect.addEventListener("change", updatePlayer);
