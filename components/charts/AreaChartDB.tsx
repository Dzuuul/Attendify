import React from "react";
// import Chart from "react-apexcharts";
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const AreaChart = (props: any) => {
  let series = props.series;
  const options: any = {
    chart: {
      type: "area",
      zoom: {
        enabled: false,
      },
      foreColor: '#fff'
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
      curve: "smooth",
    },
    title: {
      text: '',
      align: "left",
    },
    grid: {
      row: {
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: props.categories,
      labels: {
        show: true,
        rotate: -45,
        style: {
          colors: '#fff',
        }
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          colors: '#fff',
        }
      },
    },
  };
  return (
    <>
      <h4 style={{ color: '#fff' }}>
        Overview
      </h4>
      <h2 style={{ color: '#fff' }}>{props.title}</h2>
      <div className="p-4 flex-auto">
        {series !== undefined ? (
            <Chart
              options={options}
              series={series}
              type="area"
              width="100%"
              height="350"
            />
        ) : (
          <div></div>
        )}
      </div>
    </>
  );
};

export default AreaChart;