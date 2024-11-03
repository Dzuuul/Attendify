import React from "react";
// import Chart from "react-apexcharts";
// import dynamic from 'next/dynamic'
import Chart from "react-apexcharts";

// const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const LineChart = (props: any) =>
{
  let series = props.series;
  const options: any = {
    chart: {
      type: "line",
      zoom: {
        enabled: false,
      },
    },
    responsive: [
      {
        breakpoint: 840,
        options: {
          chart: {
            width: "100%",
          },
        },
      },
    ],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: {
      text: props.title,
      align: "left",
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: props.categories,
      labels: {
        show: true,
        rotate: -45,
      },
    },
  };
  return (
    <div className="app">
      <div className="row">
        <div className="mixed-chart">
          {series !== undefined ? (
              <Chart
                options={options}
                series={series}
                type="line"
                width="100%"
                height="350"
              />
          ) : (
              <div></div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LineChart;
