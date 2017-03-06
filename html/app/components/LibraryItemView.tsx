/*--------------------------------------------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------*/

import * as React from "react";
import { Button, DropdownButton, MenuItem } from "react-bootstrap";
import * as API from "../actions/api";
import * as util from "../utils/util";

interface ILibraryProps extends React.Props<any> {
    library: any;
    installLibrary: (libraryName, version, callback) => void;
    uninstallLibrary: (libraryName, libraryPath, callback) => void;
}

interface ILibraryState extends React.Props<any> {
    version: string;
    isInstalling: boolean;
    isUninstalling: boolean;
}

export default class LibraryItemView extends React.Component<ILibraryProps, ILibraryState> {
    private renderedElement = null;
    private library = null;
    private previousState = { version: "", isInstalling: false, isUninstalling: false};

    constructor(props) {
        super(props);
        this.state = {
            version: "",
            isInstalling: false,
            isUninstalling: false,
        };
        this.versionUpdate = this.versionUpdate.bind(this);
    }

    public render() {
        const compareKeys = ["name", "installed", "version"];
        // Cache render element to improve perfomance.
        if (!this.renderedElement || !util.shallowEqual(this.library, this.props.library, compareKeys)
            || !util.shallowEqual(this.previousState, this.state)) {
            this.library = this.props.library;
            this.previousState = { ...this.state };
            this.renderedElement = this._render();
        }
        return this.renderedElement;
    }

    private _render() {
        return (<div className="listitem">
            { this.buildLibrarySectionHeader(this.props.library) }
            { this.buildLibrarySectionBody(this.props.library) }
            { this.buildLibrarySectionButtons(this.props.library) }
        </div>);
    }

    private versionUpdate(eventKey: any, event?: React.SyntheticEvent<{}>): void {
        this.setState({
            version: eventKey,
        });
    }

    private openLink(url) {
        API.openLink(url);
    }

    private installLibrary(libraryName, version) {
        this.setState({
            isInstalling: true,
        });
        this.props.installLibrary(libraryName, version, () => {
            this.setState({
                isInstalling: false,
            });
        });
    }

    private uninstallLibrary(libraryName, libraryPath) {
        this.setState({
            isUninstalling: true,
        });
        this.props.uninstallLibrary(libraryName, libraryPath, () => {
            this.setState({
                isUninstalling: false,
            });
        });
    }

    private addLibPath(path) {
        API.addLibPath(path);
    }

    private buildLibrarySectionHeader(lib) {
        return (<div><span className="listitem-header">{lib.name}</span>
            {
                lib.builtIn && (<span> Built-In </span>)
            }
            {
                lib.author && (<span className="listitem-author"> by <span className="listitem-header">{lib.author}</span></span>)
            }
            {
                lib.installed && (
                    <span className="listitem-author"> Version {lib.version || "Unknown"} <span className="listitem-installed-header">
                        INSTALLED</span>
                    </span>
                )
            }
        </div>);
    }

    private buildLibrarySectionBody(lib) {
        return (<div>
            <span className="listitem-header">{lib.sentence}</span> {lib.paragraph}
            {
                lib.website && (<div><a className="help-link" onClick={() => this.openLink(lib.website)}>More info</a></div>)
            }
        </div>);
    }

    private buildLibrarySectionButtons(lib) {
        return (<div className="listitem-footer">
            {
                this.state.isInstalling && (<div className="toolbar-mask">Installing...</div>)
            }
            {
                this.state.isUninstalling && (<div className="toolbar-mask">Removing</div>)
            }
            {
                lib.version && (
                    <div className="right-side">
                        <Button className="operation-btn" onClick={() => this.addLibPath(lib.srcPath)}>Add to Include Path</Button>
                        {
                            lib.versions && lib.versions.length && util.versionCompare(lib.versions[0], lib.version) > 0 && (
                                <Button className="operation-btn" onClick={() => this.installLibrary(lib.name, lib.versions[0])}>Update</Button>
                            )
                        }
                        {
                            !lib.builtIn && (
                                <Button className="operation-btn"onClick={() => this.uninstallLibrary(lib.name, lib.installedPath)}>Remove</Button>
                            )
                        }
                    </div>
                )
            }
            {
                lib.versions && lib.versions.length > 1 && (
                    <div className="left-side">
                        <DropdownButton id="versionselector" title={this.state.version || "Select version"}
                            placeholder="Select version" onSelect={this.versionUpdate}>
                            { lib.versions.map((v, index) => {
                                if (v === lib.version) {
                                    return "";
                                }
                                return (<MenuItem key={index} eventKey={v} active={v === this.state.version}>{v}</MenuItem>);
                            })}
                        </DropdownButton>
                        <Button className="operation-btn" disabled={!this.state.version}
                            onClick={() => this.installLibrary(lib.name, this.state.version)}>Install</Button>
                    </div>
                )
            }
            {
                lib.versions && lib.versions.length === 1 && !lib.installed && (
                    <div className="left-side">
                        <Button className="operation-btn" onClick={() => this.installLibrary(lib.name, lib.versions[0])}>Install</Button>
                    </div>
                )
            }
        </div>);
    }

}
