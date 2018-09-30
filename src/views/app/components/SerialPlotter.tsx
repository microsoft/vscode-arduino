import * as React from "react";
import { Button, Checkbox, DropdownButton, MenuItem } from "react-bootstrap";
import * as ReactList from "react-list";
import { connect } from "react-redux";
import SearchInput, { createFilter } from "react-search-input";
import * as actions from "../actions";
import { versionCompare } from "../utils/util";
import LibraryItemView from "./LibraryItemView";
import {
    HighchartsChart, Chart, withHighcharts, XAxis, YAxis, Title, Legend, LineSeries, Tooltip
  } from "react-jsx-highcharts";
import * as Highcharts from "highcharts";

interface ISerialPlotterProps extends React.Props<any> {
    plotData: {
        [field: string]: number[][]
    };
}

interface ISerialPlotterState extends React.Props<any> {}

const mapStateToProps = store => {
    return {
        plotData: store.serialPlotterStore.data,
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

class SerialPlotter extends React.Component<ISerialPlotterProps, ISerialPlotterState> {
    private fieldColorMap: {
        [field: string]: string,
    } = {};

    constructor(props) {
        super(props);
    }

    public render() {
        const lines = Object.keys(this.props.plotData).map((field) => (
            <LineSeries
                id={field}
                name={field}
                data={this.props.plotData[field]}
                color={this.getColorForField(field)}
            />
        ));

        const plotOptions = {
            series: {
                marker: {
                    enabled: false,
                }
            }
        };

        return (
            <div>
                <div>
                    <HighchartsChart plotOptions={plotOptions}>
                        <Chart zoomType="x" />
                        <Title>Serial Plotter</Title>

                        <Legend layout="vertical" align="right" verticalAlign="middle">
                            <Legend.Title>Legend</Legend.Title>
                        </Legend>

                        <Tooltip shared={true} crosshairs={true}/>

                        <XAxis type="datetime">
                            <XAxis.Title>Time</XAxis.Title>
                        </XAxis>

                        <YAxis id="value">
                            <YAxis.Title>Value</YAxis.Title>
                            {...lines}
                        </YAxis>
                    </HighchartsChart>
                </div>
            </div>
        );
    }

    private getColorForField(field: string) {
        if (!this.fieldColorMap[field]) {
            this.fieldColorMap[field] = getRandomColor();
        }

        const fieldColor = this.fieldColorMap[field];
        return fieldColor;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withHighcharts(SerialPlotter, Highcharts));


function getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
