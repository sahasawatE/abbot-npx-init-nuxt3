#!/usr/bin/env node
import { promisify } from "util";
import cp from "child_process";
import path from "path";
import fs from "fs";

// cli spinners
import ora from "ora";

// convert libs to promises
const exec = promisify(cp.exec);
const rm = promisify(fs.rm);

if (process.argv.length < 3) {
  console.log("You have to provide a name to your app.");
  console.log("For example :");
  console.log("    npx simple-ts-app my-app");
  process.exit(1);
}

const projectName = process.argv[2];
const currentPath = process.cwd();
const projectPath = path.join(currentPath, projectName);

// TODO: change to your boilerplate repo
let git_repo = "";
const version = process.argv[3];

if (!version) {
  git_repo = "https://github.com/sahasawatE/abbot-init-nuxt3.git";
} else {
  if (version === "-abbot") {
    git_repo = "git@gitlabsvr.abbot.tech:module/nuxt3-template.git";
  } else {
    console.log(
      "The second argument has to be -abbot or you can leave it blank",
    );
    console.log("For example :");
    console.log("    npx simple-ts-app my-app -abbot");
    console.log("    ------ or ------");
    console.log("    npx simple-ts-app my-app");
    process.exit(1);
  }
}

// create project directory
if (fs.existsSync(projectPath)) {
  console.log(
    `The file ${projectName} already exist in the current directory, please give it another name.`,
  );
  process.exit(1);
} else {
  fs.mkdirSync(projectPath);
}

try {
  const gitSpinner = ora("Downloading files...").start();

  // clone the repo into the project folder -> creates the new boilerplate
  await exec(`git clone --depth 1 ${git_repo} ${projectPath} --quiet`);
  gitSpinner.succeed();

  const cleanSpinner = ora("Removing useless files").start();

  // remove my git history
  const rmGit = rm(path.join(projectPath, ".git"), {
    recursive: true,
    force: true,
  });

  // remove the installation file
  const rmBin = rm(path.join(projectPath, "bin"), {
    recursive: true,
    force: true,
  });
  await Promise.all([rmGit, rmBin]);

  process.chdir(projectPath);

  // remove the packages needed for cli
  await exec("npm uninstall ora cli-spinners");
  cleanSpinner.succeed();

  const npmSpinner = ora("Installing dependencies...").start();
  await exec("npm install");
  npmSpinner.succeed();

  console.log("The installation is done!");
  console.log("You can now run your app with:");
  console.log(`    cd ${projectName}`);
  console.log(`    npm run dev`);
} catch (error) {
  // clean up in case of error, so the user does not have to do it manually
  fs.rmSync(projectPath, { recursive: true, force: true });
  console.log(error);
}
