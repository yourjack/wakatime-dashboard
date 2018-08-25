import * as React from 'react';
import { Row, Col, Icon, Panel } from 'rsuite';
import Axios from 'axios';
import moment from 'moment';
import StackedColumnChart from './StackedColumnChart';
import { getArrayFromGistData, getLastData, secondsFormat } from '../../utils/utils';
import config from '../../config';

type Props = {};

class Dashboard extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      summariesData: [],
      total: 0,
      date: 7
    };
  }

  componentDidMount() {
    const { date } = this.state;
    this.fetchSummariesData().then(response => {
      console.log(response);
      const chartData = getLastData(response, date);
      this.setState({
        chartData,
        total: this.getTotal(chartData)
      });
    });
  }

  getTotal(data) {
    return data.reduce((x, y) => x + y.grand_total.total_seconds, 0);
  }

  fetchSummariesData() {
    var summaryData = JSON.parse(localStorage.getItem('wakatime'));
    const lastDate = summaryData[summaryData.length - 1].data[0].range.date;
    const currentDate = moment()
      .subtract(1, 'd')
      .format('YYYY-MM-DD');

    // 当不存在昨天的数据时，即认为当前的数据不是最新，需要重新从 Gist 上获取
    /** TODO: 
     * 该部分的判断及本地存储逻辑需要优化，因为随着备份数据的增多，从 Gist 获取的数据越大
     * 一方面，网络请求的时间会变长，另一方面，可能 localStorage 放不下
     * **/
    const isLast = moment(currentDate).isSame(lastDate);

    if (summaryData && isLast) {
      return Promise.resolve(summaryData);
    } else {
      return Axios.get(`https://api.github.com/gists/${config.gistId}`).then(response => {
        const summaryData = getArrayFromGistData(response.data);
        localStorage.setItem('wakatime', JSON.stringify(summaryData));
        return summaryData;
      });
    }
  }

  renderHeader() {
    const { total, date } = this.state;
    return (
      <h3>
        <span>{secondsFormat(total)}</span>
        &nbsp;
      </h3>
    );
  }
  render() {
    const { chartData } = this.state;
    return (
      <Panel className="dashboard" header={this.renderHeader()}>
        <Row gutter={30} className="header">
          <Col xs={24}>
            <StackedColumnChart chartData={chartData} />
          </Col>
        </Row>
      </Panel>
    );
  }
}

export default Dashboard;
