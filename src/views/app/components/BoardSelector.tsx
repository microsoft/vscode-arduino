// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as React from "react";
import { Col } from "react-bootstrap";
import Select from "react-select";
import * as API from "../actions/api";

interface IBoardSelectorProps extends React.Props<any> {
    installedBoards: any;
    loadConfigItems();
}

interface IBoardSelectorState extends React.Props<any> {
    selectedBoard: any;
}
export default class BoardSelector extends React.Component<IBoardSelectorProps, IBoardSelectorState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedBoard: this.props.installedBoards.find((bd) => bd.isSelected),
        };
        this.updateSelectedBoard = this.updateSelectedBoard.bind(this);
    }

    public componentWillReceiveProps(nextProps) {
        if (!this.state.selectedBoard && nextProps.installedBoards.length) {
            this.setState({
                selectedBoard: nextProps.installedBoards.find((bd) => bd.isSelected),
            });
        }
    }

    public render() {
        const options = this.props.installedBoards.map((b) => {
            return {
                value: b.key,
                label: `${b.name} (${b.platform})`,
            };
        });

        return (<div className="listitem theme-listitem">
            <Col className="left-side d-inline-block" xs={3} sm={2} md={2}>Selected Board:</Col>
            <Col className="react-selector btn-group">
                <Select
                    clearable={false}
                    name="select-board"
                    options={options}
                    value={this.state.selectedBoard ? this.state.selectedBoard.key : null}
                    onChange={this.updateSelectedBoard}
                    placeholder="Select your board" />
            </Col>
        </div>);
    }

    private updateSelectedBoard(newValue: any): void {
        API.updateSelectedBoard(newValue.value).then((res) => {
            this.setState({
                selectedBoard: this.props.installedBoards.find((bd) => bd.key === newValue.value),
            });
            this.props.loadConfigItems();
        });
    }
}
