import React, { useState, useReducer } from "react";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Col from "antd/lib/col";


const { Search } = Input
// const initialState = {
//   keySearch: "",
// };

let initialState = {
  column: ''
}

export default function Searchs(props: any) {
  const [key, setKey] = useState("")
  const [state, setState] = useReducer((state: any, newState: Partial<any>) => ({...state, ...newState}), initialState)

  const handleChange = (e: any) => {
    setKey(e.target.value);
  };

  const handleChangeSelect = (e: any, { name, value }: any) => {
    setState({ [name]: value });
  };

  const onSearch = () => {
    _handleKeyUp({
      key: "Enter"
    })
  }

  const _handleKeyUp = (e: any) => {
    if (e.key === "Enter") {
      if (props.filter !== undefined) {
        let filter = props.filter;
        let data = {
          day: filter.day,
          week: filter.week,
          month: filter.month,
          key: key,
          column: filter.column,
          direction: filter.direction,
        };
        data.key = key.toUpperCase();
        props.handleFilter(data);
      } else {
        let data = {
          key: key,
          page: 1,
        };
        props.handleSearch(data);
      }
    } else {
      return "";
    }
  };

  // const handleReset = () => {
  //   setKey("");
  // };

  return (
    <Row>
      {/* <Col style={{ alignSelf: 'center', marginRight: '5px', color: 'white' }}>
      Search By :
      </Col>
      <Col>
    <Select
      style={{ width: '10em', paddingBottom: '1em', paddingTop: '1em', marginRight: '1em' }}
      onChange={handleChangeSelect}
      value={state.column}
      options={props.columnOpt}
      placeholder="Pick one"
    /> 
    </Col> */}
    <Col>
    <Search
      style={{ paddingBottom: '1em', paddingTop: '1em' }}
      name="key"
      onKeyUp={_handleKeyUp}
      value={key}
      onChange={handleChange}
      onSearch={onSearch}
      placeholder="Search..."
    />
    </Col>
    </Row>
  );
}
