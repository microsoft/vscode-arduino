/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import { connect } from "react-redux";
import SearchInput, { createFilter } from "react-search-input";
import { DropdownButton, SplitButton, MenuItem, Button } from "react-bootstrap";
import * as actions from "../actions";
import { versionCompare } from "../utils/util";

interface IBoardProps extends React.Props<any> {
    platform: any;
    installingBoardName: string;
    installErrorMessage: string;
    uninstallingBoardName: string;
    uninstallErrorMessage: string;
    installBoard: (boardName, packageName, arch, version) => void;
    uninstallBoard: (boardName, packagePath) => void;
}

interface IBoardState extends React.Props<any> {
    version: string;
}

interface IBoardManagerProps extends React.Props<any> {
    platforms: any;
    categories: any;
    requesting: boolean;
    errorMessage: string;
    installingBoardName: string;
    installErrorMessage: string;
    uninstallingBoardName: string;
    uninstallErrorMessage: string;
    loadBoardPackages: () => void;
    installBoard: (boardName, packageName, arch, version) => void;
    uninstallBoard: (boardName, packagePath) => void;
}

interface IBoardManagerState extends React.Props<any> {
    searchTerm: string;
    category: string;
}

class BoardView extends React.Component<IBoardProps, IBoardState> {
    constructor(props) {
        super(props);
        this.state = {
            version: "",
        };
        this.versionUpdate = this.versionUpdate.bind(this);
    }

    versionUpdate(eventKey:any, event?: React.SyntheticEvent<{}>): void {
        console.log(arguments);
        this.setState({
            version: eventKey
        });
    }

    buildBoardSectionHeader(p) {
        return (<div>
                <span className="board-header">{p.name}</span> by <span className="board-header" href={p.package.websiteURL}>{p.package.maintainer}</span>
                {
                    p.installedVersion && (<span> version {p.installedVersion} <span className="installed-header">INSTALLED</span></span>)
                }
            </div>);
    }

    buildBoardSectionBody(p) {
        return (<div>
                <div>
                    Boards included in this package:<br/> {p.boards.map((board: any) => board.name).join(", ")}  
                </div>
                {
                    p.help && p.help.online && (
                        <div><a href={`javascript:top.window.location.href='${p.help.online}'`} target="_blank">Online help</a></div>
                    )
                }
                {
                    p.package.help && p.package.help.online && (
                        <div><a href={`javascript:top.window.location.href='${p.package.help.online}'`} target="_blank">Online help</a></div>
                    )
                }
                <div><a href={p.package.websiteURL} target="_top">More info</a></div>
            </div>);
    }

    buildBoardSecionButtons(p) {
        return (<div className="board-footer">
                {
                    this.props.installingBoardName === p.name && (<span className="right-side">Installing...</span>)
                }
                {
                    this.props.uninstallingBoardName === p.name && (<span className="right-side">Removing...</span>)
                }
                {
                    p.installedVersion && this.props.installingBoardName !== p.name && this.props.uninstallingBoardName !== p.name && (
                        <div className="right-side">
                            {
                                p.versions && p.versions.length && versionCompare(p.versions[0], p.installedVersion) > 0 && (
                                    <Button className="operation-btn" onClick={() => this.props.installBoard(p.name, p.package.name, p.architecture, p.versions[0])}>Update</Button>
                                )
                            }
                            <Button className="operation-btn" onClick={() => this.props.uninstallBoard(p.name, p.rootBoardPath)}>Remove</Button>
                        </div>
                    )
                }
                {
                    !p.defaultPlatform && this.props.installingBoardName !== p.name && this.props.uninstallingBoardName !== p.name && (
                        <div className="left-side">
                            <DropdownButton id="versionselector" title={this.state.version || "Select version"} placeholder="Select version" onSelect={this.versionUpdate}>
                                { p.versions.map((v, index) => {
                                    if (v === p.installedVersion) {
                                        return "";
                                    }
                                    return (<MenuItem key={index} eventKey={v} active={v === this.state.version}>{v}</MenuItem>)
                                })}
                            </DropdownButton>
                            <Button className="operation-btn" disabled={!this.state.version} onClick={() => this.props.installBoard(p.name, p.package.name, p.architecture, this.state.version)}>Install</Button>
                        </div>
                    )
                }
            </div>);
    }

    render() {
        return (<div className="board">
            { this.buildBoardSectionHeader(this.props.platform) }
            { this.buildBoardSectionBody(this.props.platform) }
            { this.buildBoardSecionButtons(this.props.platform) }
        </div>)
    }
}

const mapStateToProps = (state) => {
    return {
        platforms: state.boardManagerStore.platforms,
        categories: state.boardManagerStore.categories,
        requesting: state.boardManagerStore.requesting,
        errorMessage: state.boardManagerStore.errorMessage,
        installingBoardName: state.boardManagerStore.installingBoardName,
        installErrorMessage: state.boardManagerStore.installErrorMessage,
        uninstallingBoardName: state.boardManagerStore.uninstallingBoardName,
        uninstallErrorMessage: state.boardManagerStore.uninstallErrorMessage
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        loadBoardPackages: () => actions.getBoardPackages(dispatch),
        installBoard: (boardName, packageName, arch, version) => actions.installBoard(dispatch, boardName, packageName, arch, version, () => {
            actions.getBoardPackages(dispatch);
        }),
        uninstallBoard: (boardName, packagePath) => actions.uninstallBoard(dispatch, boardName, packagePath, () => {
            actions.getBoardPackages(dispatch);
        })
    };
};

const KEYS_TO_FILTERS = ['name'];

class BoardManager extends React.Component<IBoardManagerProps, IBoardManagerState> {
    
    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            category: "All"
        };
        this.searchUpdate = this.searchUpdate.bind(this);
        this.typeUpdate = this.typeUpdate.bind(this);
        this.dropdownToggle = this.dropdownToggle.bind(this);
    }

    componentWillMount() {
        this.props.loadBoardPackages();
    }

    dropdownToggle(isOpen) {
        console.log(isOpen);
    }

    typeUpdate(eventKey:any, event?: React.SyntheticEvent<{}>): void {
        console.log(arguments);
        this.setState({
            category: eventKey
        });
    }

    searchUpdate(term) {
        this.setState({
            searchTerm: term
        });
    }
    
    render() {
        const filteredTypes = this.props.platforms.filter(element => {
            if (this.state.category === "All") {
                return true;
            } else if (this.state.category === "Updatable" && element.installedVersion && element.versions && element.versions.length) {
                return versionCompare(element.versions[0], element.installedVersion) > 0;
            }
            return this.state.category === element.category;
        });
        const filteredPlatforms = filteredTypes.filter(createFilter(this.state.searchTerm, KEYS_TO_FILTERS));
        const boardProps = {
            installingBoardName: this.props.installingBoardName,
            installErrorMessage: this.props.installErrorMessage,
            uninstallingBoardName: this.props.uninstallingBoardName,
            uninstallErrorMessage: this.props.uninstallErrorMessage,
            installBoard: this.props.installBoard,
            uninstallBoard: this.props.uninstallBoard
        };
        
        return (
        <div>
            {
                this.props.requesting && (
                    <div>Loading...</div>
                )
            }
            <div>
                {
                    !this.props.requesting && (
                        <div className="boardmanager-toolbar">
                            <div className="typeselector-header">Type</div>
                            <DropdownButton id="typeselector" title={this.state.category} onSelect={this.typeUpdate}>
                                { this.props.categories.map((c, index) => {
                                    return (<MenuItem key={index} eventKey={c} active={c === this.state.category}>{c}</MenuItem>)
                                })}
                            </DropdownButton>
                            <SearchInput className="search-input" placeholder="Filter your search..." onChange={this.searchUpdate} />
                        </div>
                    )
                }
                <div className="boardmanager-container">
                    {
                        filteredPlatforms.map((p, index) => {
                            return (<BoardView key={index} platform={p} {...boardProps} />);
                        })
                    }
                </div>
            </div>
        </div>)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BoardManager);