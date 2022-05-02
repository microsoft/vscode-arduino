// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as React from "react";
import { Button, Checkbox, DropdownButton, MenuItem } from "react-bootstrap";
import * as ReactList from "react-list";
import { connect } from "react-redux";
import SearchInput, { createFilter } from "react-search-input";
import { versionCompare } from "../../../common/sharedUtilities/utils";
import * as actions from "../actions";
import LibraryItemView from "./LibraryItemView";

interface ILibraryManagerProps extends React.Props<any> {
    libraries: any;
    types: any[];
    categories: any[];
    requesting: boolean;
    errorMessage: string;
    installingLibraryName: string;
    uninstallingLibraryName: string;
    loadLibraries: (update: boolean) => void;
    installLibrary: (libraryName, version, callback) => void;
    uninstallLibrary: (libraryName, libraryPath, callback) => void;
}

interface ILibraryManagerState extends React.Props<any> {
    searchTerm: string;
    type: string;
    topic: string;
    checked: boolean;
}

const mapStateToProps = (store) => {
    return {
        libraries: store.libraryManagerStore.libraries,
        types: store.libraryManagerStore.types,
        categories: store.libraryManagerStore.categories,
        requesting: store.libraryManagerStore.requesting,
        errorMessage: store.libraryManagerStore.errorMessage,
        installingLibraryName: store.libraryManagerStore.installingLibraryName,
        uninstallingLibraryName: store.libraryManagerStore.uninstallingLibraryName,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadLibraries: (update: boolean = false) => actions.getLibraries(dispatch, update),
        installLibrary: (libraryName, version, callback) => actions.installLibrary(dispatch, libraryName, version, (error) => {
            if (!error) {
                // Refresh library manager view
                actions.getLibraries(dispatch, false, callback);
            } else {
                callback();
            }
        }),
        uninstallLibrary: (libraryName, libraryPath, callback) => actions.uninstallLibrary(dispatch, libraryName, libraryPath, (error) => {
            if (!error) {
                // Refresh library manager view
                actions.getLibraries(dispatch, false, callback);
            } else {
                callback();
            }
        }),
    };
};

class LibraryManager extends React.Component<ILibraryManagerProps, ILibraryManagerState> {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            type: "All",
            topic: "All",
            checked: false,
        };
        this.typeUpdate = this.typeUpdate.bind(this);
        this.topicUpdate = this.topicUpdate.bind(this);
        this.searchUpdate = this.searchUpdate.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
    }

    public componentWillMount() {
        this.props.loadLibraries(false);
    }

    public render() {
        function filterType(element, type) {
            switch (type) {
                case "All":
                    return true;
                case "Updatable":
                    if (element.version && element.versions && element.versions.length) {
                        return versionCompare(element.versions[0], element.version) > 0;
                    }
                    return false;
                case "Installed":
                    return element.installed;
                default:
                    return element.types && element.types.length && element.types.some((ele) => ele === type);
            }
        }

        function filterTopic(element, topic) {
            switch (topic) {
                case "All":
                    return true;
                case "Uncategorized":
                    return !element.category || element.category === topic;
                default:
                    return element.category === topic;
            }
        }

        const SEARCH_KEYS = ["name", "sentence", "paragraph"];
        const filterSearch = createFilter(this.state.searchTerm, SEARCH_KEYS);
        const filteredLibraries = this.props.libraries.filter((element) => {
            const filterSupported = this.state.checked ? element.supported : true;
            if (filterSupported && filterType(element, this.state.type) && filterTopic(element, this.state.topic) && filterSearch(element)) {
                return true;
            } else {
                return false;
            }
        });
        const totalCount = filteredLibraries.length;
        let totalCountTips = "";
        if (this.state.type === "All" && this.state.topic === "All" && !this.state.searchTerm) {
            totalCountTips = `Total ${totalCount} Libraries`;
        } else {
            totalCountTips = `${totalCount} Libraries matched`;
        }

        const libraryItemProps = {
            installLibrary: this.props.installLibrary,
            uninstallLibrary: this.props.uninstallLibrary,
        };
        const isOperating = !!this.props.installingLibraryName || !!this.props.uninstallingLibraryName;

        const itemRenderer = (index, key) => {
            // On updating a list, ReactList can call itemRenderer with large indices.
            if (index >= filteredLibraries.length) {
                return null;
            }
            return (<LibraryItemView key={filteredLibraries[index].name} library={filteredLibraries[index]} {...libraryItemProps}/>);
        };
        const itemSizeEstimator = (index, cache) => {
            return 200;
        };

        return (<div className={"librarymanager " + (isOperating ? "disabled" : "")}>
            {
                this.props.requesting && (
                    <div className="mask theme-bgcolor">Loading...</div>
                )
            }
            <div className="arduinomanager-toolbar theme-bgcolor">
                <div className="dropdown-filter">
                    <span className="dropdown-label">Type</span>
                    <DropdownButton id="typeselector" title={this.state.type} onSelect={this.typeUpdate}>
                        { this.props.types.map((c, index) => {
                            return (<MenuItem key={index} eventKey={c} active={c === this.state.type}>{c}</MenuItem>);
                        })}
                    </DropdownButton>
                </div>
                <div className="dropdown-filter">
                    <span className="dropdown-label">Topic</span>
                    <DropdownButton id="topicselector" title={this.state.topic} onSelect={this.topicUpdate}>
                        { this.props.categories.map((c, index) => {
                            return (<MenuItem key={index} eventKey={c} active={c === this.state.topic}>{c}</MenuItem>);
                        })}
                    </DropdownButton>
                </div>
                <SearchInput className="search-input" placeholder="Filter your search..." onChange={this.searchUpdate} />
                <Checkbox className="supported-checkbox" onChange={this.handleCheck}>Only show libraries supported by current board</Checkbox>
                <Button className="operation-btn" bsStyle="link" onClick={() => this.props.loadLibraries(true)}>
                        Refresh Library Index
                </Button>
            </div>
            <div className="arduinomanager-container">
                <ReactList itemRenderer={itemRenderer} itemSizeEstimator={itemSizeEstimator} length={filteredLibraries.length} type="variable"/>
            </div>
            <div className="arduinomanager-footer theme-bgcolor">
                <span>{ totalCountTips }</span>
            </div>
        </div>);
    }

    private typeUpdate(eventKey: any, event?: React.SyntheticEvent<{}>): void {
        this.setState({
            type: eventKey,
        });
    }

    private topicUpdate(eventKey: any, event?: React.SyntheticEvent<{}>): void {
        this.setState({
            topic: eventKey,
        });
    }

    private searchUpdate(term) {
        this.setState({
            searchTerm: term,
        });
    }

    private handleCheck() {
        this.setState({
            checked: !this.state.checked,
        });
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryManager);
