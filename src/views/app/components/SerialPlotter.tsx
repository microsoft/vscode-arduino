import * as Highcharts from "highcharts/highstock";
import * as boost from "highcharts/modules/boost";
import * as React from "react";
import {
    Button,
    ControlLabel,
    FormControl,
    FormGroup,
    InputGroup,
} from "react-bootstrap";
import * as API from "../actions/api";
import { chartConfig } from "./chartConfig";

boost(Highcharts);

interface IDataFrame {
    time: number;
    [field: string]: number;
}

interface IDataAction {
    action: string;
}

interface ISerialPlotterState extends React.Props<any> {
    rate: string;
    active: boolean;
}

class SerialPlotter extends React.Component<void, ISerialPlotterState> {
    public state = {
        rate: "100",
        active: false,
    };

    private _chartRef: HTMLElement;
    private _chart: Highcharts;

    constructor(props) {
        super(props);
    }

    public componentDidMount() {
        this.initMessageHandler();
        this.initChart();
    }

    public render() {
        return (
            <div>
                <div ref={(el) => (this._chartRef = el)} />
                <div>
                    <FormGroup bsSize="small">
                        <InputGroup>
                            <ControlLabel>Refresh rate</ControlLabel>
                            <FormControl
                                type="text"
                                value={this.state.rate}
                                onChange={this.onRateChange}
                            />
                            <InputGroup.Button>
                                <Button onClick={this.updatePlotRefreshRate}>
                                    Apply
                                </Button>
                            </InputGroup.Button>
                        </InputGroup>

                        <InputGroup>
                            <InputGroup.Button>
                                <Button onClick={this.reset}>Reset</Button>
                            </InputGroup.Button>
                        </InputGroup>

                        <InputGroup>
                            <InputGroup.Button>
                                <Button
                                    onClick={
                                        this.state.active
                                            ? this.pause
                                            : this.play
                                    }
                                >
                                    {this.state.active ? "Pause" : "Play"}
                                </Button>
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

    private addFrame(frame: IDataFrame) {
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
                    type: "line",
                });
            }
        }
    }

    private doAction(action: IDataAction) {
        if (action.action === "RESET") {
            this.reset();
        }
    }

    private play = () => {
        this.setState({
            active: true,
        });
    }

    private pause = () => {
        this.setState({
            active: false,
        });
    }

    private reset = () => {
        while (this._chart.series.length > 0) {
            this._chart.series[0].remove(false);
        }

        this._chart.redraw();
    }

    private initMessageHandler() {
        window.addEventListener("message", (event) => {
            const data = event.data;

            if (!this.state.active) {
                return;
            }

            if (data.time) {
                this.addFrame(data);
            } else if (data.action) {
                this.doAction(data);
            }
        });

        this.setState({
            active: true,
        });
    }

    private updatePlotRefreshRate = async () => {
        const rate = parseInt(this.state.rate, 10);

        if (!Number.isFinite(rate)) {
            return;
        }

        await API.updatePlotRefreshRate(rate);
    }

    private onRateChange = (e) => {
        this.setState({
            rate: e.target.value,
        });
    }
}

export default SerialPlotter;

function getRandomColor(): string {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
