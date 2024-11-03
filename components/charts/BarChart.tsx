import React from "react";
// import Chart from "react-apexcharts";
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const Bar = (props: any) => {
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
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      }
    },
    // yaxis: {
    //   labels: {
    //     formatter: function(value:any){
    //       return formatNumber(value as number);
    //     },
    //     show: true,
    //     style: {
    //       colors: '#000',
    //     }
    //   },
    // },
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

export default Bar;
