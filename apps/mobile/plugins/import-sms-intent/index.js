// Adds ImportBankSMSIntent.swift to the iOS app target. App Intents must be compiled into the app
// itself for iOS to list them in Shortcuts, and ios/ is generated, so this runs on every prebuild.
const { IOSConfig, withDangerousMod, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FILE_NAME = "ImportBankSMSIntent.swift";

function withImportSmsIntent(config) {
  config = withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(modConfig.modRequest.projectRoot);
      const destination = path.join(modConfig.modRequest.platformProjectRoot, projectName, FILE_NAME);
      fs.copyFileSync(path.join(__dirname, FILE_NAME), destination);
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(modConfig.modRequest.projectRoot);
    const filepath = `${projectName}/${FILE_NAME}`;
    if (!modConfig.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project: modConfig.modResults });
    }
    return modConfig;
  });
}

module.exports = withImportSmsIntent;
