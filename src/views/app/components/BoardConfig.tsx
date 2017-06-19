// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as React from "react";
import { Grid, Row } from "react-bootstrap";
import { connect } from "react-redux";
import * as actions from "../actions";
import BoardConfigItemView from "./BoardConfigItemView";
import BoardSelector from "./BoardSelector";

interface IBoardConfigProps extends React.Props<any> {
    configitems: any;
    installedBoards: any;
    loadConfigItems: () => void;
    loadInstalledBoards(): () => void;
}

const mapStateToProps = (state) => {
    return {
        installedBoards: state.boardConfigStore.installedBoards,
        configitems: state.boardConfigStore.configitems,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadInstalledBoards: () => actions.getInstalledBoards(dispatch),
        loadConfigItems: () => actions.getConfigItems(dispatch),
    };
};

class BoardConfig extends React.Component<IBoardConfigProps, React.Props<any>> {
    constructor(props) {
        super(props);
        this.state = {};
    }

    public componentWillMount() {
        this.props.loadInstalledBoards();
        this.props.loadConfigItems();
    }

    public render() {
        return (<div className="boardConfig">
            <Grid fluid>
                <Row key="board-selector">
                    <BoardSelector installedBoards={this.props.installedBoards} loadConfigItems={this.props.loadConfigItems} />
                </Row>
                {
                    this.props.configitems.map((configitem, index) => {
                        return (<Row key={configitem.id}>
                            <BoardConfigItemView configitem={configitem} />
                        </Row>);
                    })
                }
            </Grid>
        </div>);
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BoardConfig);
