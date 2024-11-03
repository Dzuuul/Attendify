import React from "react";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Table from "antd/lib/table";
import AreaChart from "../components/charts/AreaChart2";
import Column from "antd/lib/table/Column";
import Form from "antd/lib/form";
import Select from "antd/lib/select"
import Statistic from "antd/lib/statistic";
import Card from "antd/lib/card"
// import { getUser } from "../utils/Helper";

const SummaryData = (props: any) => {

  const handleChangeSelect = (e: any, name: any) => {
    props.setEmployeeId(e)
  };

  let series = props.series === undefined ? [] : props.series;
  let categories = props.categories === undefined ? [] : props.categories;

  return (
    <>
      <Row>
        <Col span={24} style={{padding: '0 2em 0 2em'}}>
          <Form>
            <Form.Item label="Select Employee" name="employeeId">
              <Select
                showSearch
                filterOption={(input, option) =>
                  option?.props.label
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
                value={''}
                onChange={(e) => {
                  handleChangeSelect(e, "employeeId")
                }}
                options={props.employees}
                placeholder="Pick an employee"
                className={"select"}
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{padding: '0 2em 0 2em'}}>
          <AreaChart
            title={props.title}
            series={series}
            categories={categories}
          />
        </Col>
      </Row>
    </>
  );
};

export default SummaryData;
