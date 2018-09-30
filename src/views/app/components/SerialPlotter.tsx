import * as React from "react";
import { connect, ReactNode } from "react-redux";
import {
    FormGroup,
    FormControl,
    Col,
    Button,
    InputGroup,
    ControlLabel
} from "react-bootstrap";
import * as Highcharts from "highcharts/highstock";
import * as boost from "highcharts/modules/boost";
import { chartConfig } from "./chartConfig";

boost(Highcharts);

interface ISerialPlotterProps extends React.Props<any> {
    plotData: {
        [field: string]: number[][];
    };
}

interface ISerialPlotterState extends React.Props<any> {}

const mapStateToProps = store => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {};
};

class SerialPlotter extends React.Component<
    ISerialPlotterProps,
    ISerialPlotterState
> {
    private _chartRef: HTMLElement;
    private _chart: Highcharts;
    private _ws: WebSocket;

    constructor(props) {
        super(props);
    }

    public componentDidMount() {
        this.initWebSocket();
        this.initChart();
    }

    public render() {
        return (
            <div>
                <div ref={el => (this._chartRef = el)} />
                <div>
                    <FormGroup bsSize="small">
                        <InputGroup>
                            <ControlLabel>Refresh rate</ControlLabel>
                            <FormControl type="text" value="100" />
                            <InputGroup.Button>
                                <Button>Apply</Button>
                            </InputGroup.Button>
                        </InputGroup>
                    </FormGroup>
                </div>
            </div>
        );
    }

    private initChart() {
        this._chart = Highcharts.stockChart(this._chartRef, chartConfig);
    }

    private addFrame(frame) {
        const time = frame.time;

        for (const field of Object.keys(frame)) {
            if (field === "time") {
                continue;
            }

            const point = [time, frame[field]];
            const series = this._chart.get(field);

            if (series) {
                series.addPoint(point, true, false, false);
            } else {
                this._chart.addSeries({
                    id: field,
                    name: field,
                    data: [point],
                    color: getRandomColor(),
                    type: "line"
                });
            }
        }
    }

    private initWebSocket() {
        this._ws = new WebSocket(`ws://${window.location.host}`);

        this._ws.onmessage = (e: MessageEvent) => {
            this.addFrame(JSON.parse(e.data));
        };
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SerialPlotter);

function getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
