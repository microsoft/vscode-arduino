/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Button, Checkbox, DropdownButton, MenuItem } from "react-bootstrap";
import { connect } from "react-redux";
import SearchInput, { createFilter } from "react-search-input";
import * as actions from "../actions";
import { versionCompare } from "../utils/util";
import LibraryItemView from "./LibraryItemView";

interface ILibraryManagerProps extends React.Props<any> {
    libraries: any;
    types: any[];
    categories: any[];
    requesting: boolean;
    errorMessage: string;
    installingLibraryName: string;
    uninstallingLibraryName: string;
    loadLibraries: () => void;
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
        loadLibraries: () => actions.getLibraries(dispatch),
        installLibrary: (libraryName, version, callback) => actions.installLibrary(dispatch, libraryName, version, (error) => {
            if (!error) {
                // Refresh library manager view
                actions.getLibraries(dispatch, callback);
            } else {
                callback();
            }
        }),
        uninstallLibrary: (libraryName, libraryPath, callback) => actions.uninstallLibrary(dispatch, libraryName, libraryPath, (error) => {
            if (!error) {
                // Refresh library manager view
                actions.getLibraries(dispatch, callback);
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
        this.props.loadLibraries();
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
        let totalCount = 0;
        this.props.libraries.forEach((element) => {
            const filterSupported = this.state.checked ? element.supported : true;
            if (filterSupported && filterType(element, this.state.type) && filterTopic(element, this.state.topic) && filterSearch(element)) {
                element.shouldBeDisplayed = true;
                totalCount++;
            } else {
                element.shouldBeDisplayed = false;
            }
        });
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

        return (<div className={"librarymanager " + (isOperating ? "disabled" : "")}>
            {
                this.props.requesting && (
                    <div className="mask theme-bgcolor">Loading...</div>
                )
            }
            <div className="arduinomanager-toolbar theme-bgcolor">
                <div className="dropdown-label">Type</div>
                <DropdownButton id="typeselector" title={this.state.type} onSelect={this.typeUpdate}>
                    { this.props.types.map((c, index) => {
                        return (<MenuItem key={index} eventKey={c} active={c === this.state.type}>{c}</MenuItem>);
                    })}
                </DropdownButton>
                <div className="dropdown-label">Topic</div>
                <DropdownButton id="topicselector" title={this.state.topic} onSelect={this.topicUpdate}>
                    { this.props.categories.map((c, index) => {
                        return (<MenuItem key={index} eventKey={c} active={c === this.state.topic}>{c}</MenuItem>);
                    })}
                </DropdownButton>
                <SearchInput className="search-input" placeholder="Filter your search..." onChange={this.searchUpdate} />
                <Checkbox className="supported-checkbox" onChange={this.handleCheck}>Only show libraries supported by current board</Checkbox>
            </div>
            <div className="arduinomanager-container">
                {
                    this.props.libraries.map((library, index) => {
                        return (<div key={library.name} className={library.shouldBeDisplayed ? "" : "hidden"}>
                                <LibraryItemView library={library} {...libraryItemProps}/>
                            </div>);
                    })
                }
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
