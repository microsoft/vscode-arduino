// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as Tree from "rc-tree";
import * as React from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import * as API from "../actions/api";

// TODO: I'm pretty sure this entire view is unused and can be removed.
// See exampleProvider.ts which instead uses the built-in VS Code Tree View API.

interface IExampleViewProps extends React.Props<any> {
    examples: any[];
    loadExamples: () => void;
}

interface IExampleViewState extends React.Props<any> {
    expandedKeys: any[];
}

const mapStateToProps = (store) => {
    return {
        examples: store.exampleStore.examples,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadExamples: () => actions.getExamples(dispatch),
    };
};

class ExampleTreeView extends React.Component<IExampleViewProps, IExampleViewState> {

    public constructor(props) {
        super(props);
        this.state = {
            expandedKeys: [],
        };
        this.openExample = this.openExample.bind(this);
        this.onExpand = this.onExpand.bind(this);
    }

    public componentWillMount() {
        this.props.loadExamples();
    }

    public render() {
        return (<Tree className="exampleview" onSelect={this.openExample} onExpand={this.onExpand}
                      expandedKeys={this.state.expandedKeys} autoExpandParent={false}>
            { this.getTreeNodes(this.props.examples) }
        </Tree>);
    }

    private getTreeNodes(examples) {
        const nodes = examples.map((example) => {
            if (example.children && example.children.length) {
                return (<Tree.TreeNode key={example.path} title={example.name} isLeaf={false} expanded={!!this.state[example.path]}>
                    { this.getTreeNodes(example.children) }
                </Tree.TreeNode>);
            } else {
                return (<Tree.TreeNode key={example.path} title={example.name} isLeaf={true} />);
            }
        });
        return nodes;
    }

    private openExample(selectedKeys, event) {
        if (event.node.props.isLeaf) {
            API.openExample(event.node.props.eventKey);
        } else {
            const index = this.state.expandedKeys.indexOf(event.node.props.eventKey);
            const expanded = !event.node.props.expanded;
            if (expanded && index === -1) {
                const expandedKeys = [... this.state.expandedKeys];
                expandedKeys.push(event.node.props.eventKey);
                this.setState({
                    expandedKeys,
                });
            } else if (!expanded && index > -1) {
                const expandedKeys = [... this.state.expandedKeys];
                expandedKeys.splice(index, 1);
                this.setState({
                    expandedKeys,
                });
            }
        }
    }

    private onExpand(expandedKeys, event) {
        this.setState({
            expandedKeys: [... expandedKeys],
        });
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ExampleTreeView);
