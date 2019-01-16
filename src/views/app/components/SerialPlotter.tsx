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

enum MessageType {
    Frame = "Frame",
    Action = "Action",
}

enum Action {
    Reset = "Reset",
}

interface IMessage {
    type: MessageType;
}

interface IMessageFrame extends IMessage {
    type: typeof MessageType.Frame;
    time?: number;
    [field: string]: string | number;
}

interface IMessageAction extends IMessage {
    type: typeof MessageType.Action;
    action: Action;
}

interface ISerialPlotterState extends React.Props<any> {
    rate: string;
    active: boolean;
}

class SerialPlotter extends React.Component<void, ISerialPlotterState> {
    public static DEFAULT_THROTTLING = 100;

    public state = {
        rate: SerialPlotter.DEFAULT_THROTTLING.toString(),
        active: false,
    };

    private _chartRef: HTMLElement = null;
    private _chart: Highcharts = null;

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

    private addFrame(frame: IMessageFrame) {
        const time = frame.time;

        for (const field of Object.keys(frame)) {
            if (field === "time" || field === "type") {
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

    private doAction(msg: IMessageAction) {
        if (msg.action === Action.Reset) {
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
        this.initChart();
    }

    private initMessageHandler() {
        window.addEventListener("message", (event) => {
            if (!this.state.active) {
                return;
            }

            const data: IMessage = event.data;

            switch (data.type) {
                case MessageType.Frame:
                    this.addFrame(data as IMessageFrame);
                    break;
                case MessageType.Action:
                    this.doAction(data as IMessageAction);
                    break;
                default:
                    console.warn("Unknown message type", data);
            }
        });

        this.setState({
            active: true,
        });
    }

    private updatePlotRefreshRate = () => {
        const rate = parseInt(this.state.rate, 10);

        if (!Number.isFinite(rate)) {
            return;
        }

        API.updatePlotRefreshRate(rate);
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
