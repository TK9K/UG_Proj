import React from "react";
import ReactApexChart from "react-apexcharts";

// Placeholder HeatMap Code Adapted From CodeSanbox Sample (https://codesandbox.io/p/sandbox/apexchart-heatmap-forked-0m7bs?file=%2Fsrc%2FApp.js%3A226%2C21)

const options = {
    chart: {
        height: 350,
        type: "heatmap"
    },
    plotOptions: {
        heatmap: {
            colorScale: {
            }
        }
    },
    dataLabels: {
        enabled: false
    },
    title: {
        text: ""
    }
};

var series = [
    {
        name: "Week 4",
        data: formatData([
            45,
            45,
            30,
            5,
            20,
            25,
            5
        ])
    },
    {
        name: "Week 3",
        data: formatData([
            15,
            10,
            5,
            55,
            20,
            10,
            5
        ])
    },
    {
        name: "Week 2",
        data: formatData([
            3,
            60,
            10,
            15,
            55,
            4,
            7
        ])
    },
    {
        name: "Week 1",
        data: formatData([
            2,
            4,
            10,
            2,
            20,
            90,
            0
        ])
    }
];

function formatData(data) {
    let newData = [];
    let categories = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    for (var i = 0; i < categories.length; i++) {
        newData.push({
            x: categories[i],
            y: data[i]
        });
    }
    console.log(newData);
    return newData;
}

export default function HeatMapPlaceholder() {
    return (
        <div className="App">
            <ReactApexChart
                options={options}
                series={series}
                type="heatmap"
                height="350"
            />
        </div>
    );
}
