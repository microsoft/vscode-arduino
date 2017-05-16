/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Grid, Row } from "react-bootstrap";
import { connect } from "react-redux";
import * as actions from "../actions";
import BoardConfigItemView from "./BoardConfigItemView";

interface IBoardConfigProps extends React.Props<any> {
    configitems: any;
    loadConfigItems: () => void;
}

const mapStateToProps = (state) => {
    return {
        configitems: state.boardConfigStore.configitems,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadConfigItems: () => actions.getConfigItems(dispatch),
    };
};

class BoardConfig extends React.Component<IBoardConfigProps, React.Props<any>> {
    constructor(props) {
        super(props);
        this.state = {};
    }

    public componentWillMount() {
        this.props.loadConfigItems();
    }

    public render() {
        return (<div className="board-config">
            <Grid fluid>
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
