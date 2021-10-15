const path = require('path');
const fs = require('fs');
const {execSync} = require('child_process');
const glob = require('glob');

const skipClean = process.env.SKIP_CLEAN || false;
const generator = process.env.GENERATOR || 'Ninja Multi-Config';

const removeDirectory = (path) => {
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, {recursive: true});
  }
};

const createDirectory = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {recursive: true});
  }
};

const createBuildFolder = (buildDir) => {
  if (skipClean) {
    return;
  }

  removeDirectory(buildDir);
  createDirectory(buildDir);
};

const generateBuildSystem = (sourceDir, buildDir) => {
  execSync(`cmake -G "${generator}" -S "${sourceDir}" -B "${buildDir}"`, {
    stdio: 'inherit',
  });
};

const build = (buildDir, configuration) => {
  execSync(`cmake --build "${buildDir}" --config "${configuration}"`, {
    stdio: 'inherit',
  });
};

const libraryFilename = (configuration) => {
  const extension = process.platform === 'darwin' ? 'a' : '.lib';
  const postFix = configuration === 'Debug' ? 'd' : '';
  return `libampify-e2e${postFix}.${extension}`;
};

const libraryPath = (buildDir, configuration) => {
  return path.join(
    buildDir,
    'app',
    configuration,
    libraryFilename(configuration)
  );
};

const copyLibrary = (configuration, buildDir, libDir) => {
  fs.copyFileSync(
    libraryPath(buildDir, configuration),
    path.join(libDir, libraryFilename(configuration))
  );
};

const copyHeaders = (rootDir, includeDir) => {
  const sourceDir = path.join(rootDir, 'app', 'include');
  const headers = glob.sync('**/*.h', {
    cwd: sourceDir,
  });

  headers.forEach((header) => {
    const sourceFile = path.join(sourceDir, header);
    const destFile = path.join(includeDir, header);
    createDirectory(path.dirname(destFile));
    fs.copyFileSync(sourceFile, destFile);
  });
};

const copyCmakeConfig = (sourceDir, cmakeDir) => {
  const filename = 'AmpifyE2EConfig.cmake';
  const sourceFile = path.join(sourceDir, 'cmake', filename);
  const destFile = path.join(cmakeDir, filename);
  fs.copyFileSync(sourceFile, destFile);
};

const createInstallation = (sourceDir, buildDir) => {
  const installDir = path.join(buildDir, 'installation');
  const includeDir = path.join(installDir, 'include');
  const libDir = path.join(installDir, 'lib');
  const cmakeDir = path.join(libDir, 'cmake');

  removeDirectory(installDir);
  createDirectory(installDir);
  createDirectory(includeDir);
  createDirectory(libDir);
  createDirectory(cmakeDir);

  copyLibrary('Debug', buildDir, libDir);
  copyLibrary('Release', buildDir, libDir);
  copyHeaders(sourceDir, includeDir);
  copyCmakeConfig(sourceDir, cmakeDir);
};

const main = () => {
  const sourceDir = process.cwd();
  const buildDir = path.join(process.cwd(), 'cmake-build');

  createBuildFolder(buildDir);
  generateBuildSystem(sourceDir, buildDir);
  build(buildDir, 'Debug');
  build(buildDir, 'Release');
  createInstallation(sourceDir, buildDir);
};

main();