import exp = require("constants");
import * as vscode from "vscode";
import * as logger from "./logger";
import { targetVariable } from "./variables";

const LABEL_REGEX = RegExp("@?[\\w-]*//[\\w-/]*:[\\w-]+");

let context: vscode.ExtensionContext;
let statusBarTargetInputer: vscode.StatusBarItem;

// Status bar

function setupStatusBarInputer() {
    statusBarTargetInputer.command = "zxz-moe-bis.inputBuildTarget";
    statusBarTargetInputer.tooltip = "Input build target for debugging";

    let target: string | undefined = targetVariable.get();

    if (target && target.match(LABEL_REGEX)) {
        _updateLabel(target);
        statusBarTargetInputer.text = target;
    } else {
        statusBarTargetInputer.text = "No target specified";
    }
    statusBarTargetInputer.show();
}

export async function inputBuildTarget() {
    let options: vscode.InputBoxOptions = {
        title: "Input label of target",
        value: targetVariable.get(),
        prompt: "@<WORKSPACE>//:<PATH>",
        validateInput(value) {
            let message: vscode.InputBoxValidationMessage = {
                message: "Unexpected label format",
                severity: vscode.InputBoxValidationSeverity.Warning,
            };
            return value.match(LABEL_REGEX) ? null : message;
        },
        ignoreFocusOut: true,
    };

    let label = await vscode.window.showInputBox(options);

    if (label) {
        await _updateLabel(label);
    }

    logger.log("Input label: ", label);
    return label;
}

export async function buildTarget() {
    return _getOrInputLabel();
}

export function activate(c: vscode.ExtensionContext) {
    context = c;
    statusBarTargetInputer = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    );
    setupStatusBarInputer();
}

async function _getOrInputLabel() {
    let labelString: string | undefined =
        targetVariable.get();
    if (!labelString) {
        return inputBuildTarget();
    }
    return labelString;
}

async function _updateLabel(labelString: string) {
    targetVariable.update(labelString);
    statusBarTargetInputer.text = labelString;
}
