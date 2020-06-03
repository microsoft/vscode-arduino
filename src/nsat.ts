// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

"use strict";

import * as compareVersions from "compare-versions";
import { commands, ExtensionContext, extensions, Uri, window } from "vscode";
import * as Logger from "./logger/logger";

const IS_MUST_CANDIDATE_VERSION = false;
const NSAT_SURVEY_URL = "https://www.surveymonkey.com/r/CC2GVRC";
const PROBABILITY = 0.5;
const SESSION_COUNT_THRESHOLD = 5;
const SESSION_COUNT_KEY = "nsat/sessionCount";
const LAST_SESSION_DATE_KEY = "nsat/lastSessionDate";
const TAKE_SURVEY_DATE_KEY = "nsat/takeSurveyDate";
const CANDIDATED_VERSION_KEY = "nsat/candidatedVersion";
const EXTENSION_ID = "vsciot-vscode.vscode-arduino";

export class NSAT {
  public static async takeSurvey({globalState}: ExtensionContext) {
    const extension = extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      return;
    }
    const today = new Date().toDateString();
    const epoch = new Date(0).toDateString();
    const extensionVersion = extension.packageJSON.version;
    const candidatedVersion = globalState.get<string>(CANDIDATED_VERSION_KEY);
    if (candidatedVersion && candidatedVersion !== "remindmelater") {
      if (candidatedVersion === "*" || !IS_MUST_CANDIDATE_VERSION || compareVersions(extensionVersion, candidatedVersion) <= 0) {
        return;
      }
      globalState.update(LAST_SESSION_DATE_KEY, today);
    }

    const lastSessionDate =
        globalState.get(LAST_SESSION_DATE_KEY, epoch);

    if (today === lastSessionDate) {
      return;
    }

    const sessionCount = globalState.get(SESSION_COUNT_KEY, 0) + 1;
    await globalState.update(LAST_SESSION_DATE_KEY, today);
    await globalState.update(SESSION_COUNT_KEY, sessionCount);

    if (sessionCount < SESSION_COUNT_THRESHOLD || (candidatedVersion !== "remindmelater" && Math.random() > PROBABILITY)) {
      return;
    }

    const take = {
      title: "Take Survey",
      run: async () => {
        Logger.traceUserData("nsat.survey/takeShortSurvey");
        commands.executeCommand(
            "vscode.open",
            Uri.parse(`${NSAT_SURVEY_URL}?o=${
                encodeURIComponent(process.platform)}&v=${
                encodeURIComponent(extensionVersion)}`));
        await globalState.update(CANDIDATED_VERSION_KEY, extensionVersion);
        await globalState.update(TAKE_SURVEY_DATE_KEY, today);
        await globalState.update(SESSION_COUNT_KEY, 0);
      },
    };
    const remind = {
      title: "Remind Me Later",
      run: async () => {
        Logger.traceUserData("nsat.survey/remindMeLater");
        await globalState.update(CANDIDATED_VERSION_KEY, "remindmelater");
        await globalState.update(SESSION_COUNT_KEY, 0);
      },
    };
    const never = {
      title: "Don't Show Again",
      run: async () => {
        Logger.traceUserData("nsat.survey/dontShowAgain");
        await globalState.update(CANDIDATED_VERSION_KEY, "*");
      },
    };
    Logger.traceUserData("nsat.survey/userAsked");
    const button = await window.showInformationMessage(
        "Do you mind taking a quick feedback survey about the Arduino Extension for VS Code?",
        take, remind, never);
    await (button || remind).run();
  }
}
