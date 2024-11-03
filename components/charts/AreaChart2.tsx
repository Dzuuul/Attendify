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
    annotations: {
      yaxis: [
        {
          y: 8,
          borderColor: '#be1a20',
          label: {
            borderColor: '#be1a20',
            style: {
              color: '#fff',
              background: '#be1a20',
            },
            text: '8-Hour Work Target'
          }
        }
      ]
    },
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
          colors: '#000',
        }
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          colors: '#000',
        }
      },
    },
  };
  return (
    <>
      <h4 style={{ color: '#000' }}>
        Overview
      </h4>
      <h2 style={{ color: '#000' }}>{props.title}</h2>
      <div className="p-4 flex-auto">
        {series !== undefined ? (
            <Chart
              options={options}
              series={series}
              type="bar"
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
