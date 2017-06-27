// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as React from "react";
import { Col, DropdownButton, MenuItem } from "react-bootstrap";
import * as API from "../actions/api";

interface IBoardConfigItemProps extends React.Props<any> {
    configitem: any;
}

interface IBoardConfigItemState extends React.Props<any> {
    selectedOption: string;
}
export default class BoardConfigItemView extends React.Component<IBoardConfigItemProps, IBoardConfigItemState> {
    constructor(props) {
        super(props);
        this.state = {
            selectedOption: this.props.configitem.selectedOption,
        };
        this.updateConfig = this.updateConfig.bind(this);
    }

    public render() {
        const options = this.props.configitem.options;
        return (<div className="listitem theme-listitem">
            <Col className="left-side d-inline-block" xs={3} sm={2} md={2}>
                {this.props.configitem.displayName}:
            </Col>
            <Col>
                <DropdownButton id={this.props.configitem.id} title={this.getOptionDisplayName()} placeholder="Select option"
                    onSelect={this.updateConfig}>
                    {
                        options.map((opt, index) => {
                            return (<MenuItem key={index} eventKey={opt.id} active={opt.id === this.state.selectedOption}>
                                {opt.displayName}
                            </MenuItem>);
                        })
                    }
                </DropdownButton>
            </Col>
        </div>);
    }

    private getOptionDisplayName() {
        return this.props.configitem.options.find((opt) => opt.id === this.state.selectedOption).displayName;
    }

    private updateConfig(eventKey: any, event?: React.SyntheticEvent<{}>): void {
        API.updateConfigItem(this.props.configitem.id, eventKey).then((res) => {
            this.setState({
                selectedOption: eventKey,
            });
        });
    }
}
