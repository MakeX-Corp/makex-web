import { Sandbox } from "@e2b/code-interpreter";

const APP_DIR = "/app/expo-app";

export async function createE2BContainer(metadata: {
  userId: string;
  appId: string;
  appName: string;
}) {
  const sbx = await Sandbox.create(process.env.E2B_TEMPLATE_ID as string, {
    timeoutMs: 3600 * 1000,
    metadata: metadata,
  });

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost: `https://${appHost}`,
    apiHost: `https://${apiHost}`,
    containerId: sbx.sandboxId,
  };
}

export async function resumeE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.resume(sandboxId, {
    timeoutMs: 3600 * 1000,
  });

  const appHost = sbx.getHost(8000);
  const apiHost = sbx.getHost(8001);

  return {
    appHost: `https://${appHost}`,
    apiHost: `https://${apiHost}`,
  };
}

export async function pauseE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);
  const pausedId = await sbx.pause();
  return pausedId;
}

export async function killE2BContainer(sandboxId: string) {
  const sbx = await Sandbox.kill(sandboxId);
  return sbx;
}

export async function startExpoInContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  console.log("Connected to sandbox:", sbx.sandboxId);

  const appUrl = `https://${sbx.getHost(8000)}`;

  console.log("App URL:", appUrl);

  const escapedAppUrl = appUrl.replace(/"/g, '\\"');

  await sbx.commands.run(
    `sudo pm2 start "EXPO_PACKAGER_PROXY_URL=${escapedAppUrl} npx expo start --port 8000" --name expo-server --merge-logs --output /home/user/expo_logs.txt --error /home/user/expo_logs.txt`,
    {
      cwd: APP_DIR,
      envs: {
        EXPO_PACKAGER_PROXY_URL: appUrl,
      },
      background: true,
    },
  );

  return {
    appUrl,
  };
}

export async function killDefaultExpo(sandboxId: string) {
  try {
    const sbx = await Sandbox.connect(sandboxId);

    try {
      const killResult = await sbx.commands.run(
        "sudo kill -9 $(ps aux | grep node | grep -v grep | awk '{print $2}') 2>/dev/null || true",
      );
      console.log("Kill all node processes result:", killResult);
    } catch (error) {
      console.log("Error during process kill:", error);
    }

    try {
      const checkPort = await sbx.commands.run("sudo lsof -i:8000 || true");
      console.log("Port check result:", checkPort);
    } catch (error) {
      console.log("Port 8000 is free");
    }

    return true;
  } catch (error) {
    console.error("Error in killDefaultExpo:", error);
    throw error;
  }
}

export async function writeConvexConfigInContainer(
  sandboxId: string,
  {
    deploymentName,
    convexUrl,
  }: {
    deploymentName: string;
    convexUrl: string;
  },
) {
  const sbx = await Sandbox.connect(sandboxId);
  const CONFIG_DIR = "/root/.convex";
  const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

  const ENV_FILE = `${APP_DIR}/.env.local`;

  const writeConfigCommand = [
    `sudo mkdir -p ${CONFIG_DIR}`,
    `echo '{ "accessToken": "${process.env.CONVEX_AUTH_TOKEN}" }' | sudo tee ${CONFIG_PATH} > /dev/null`,
    `sudo mkdir -p ${APP_DIR}`,
    `echo -e "CONVEX_DEPLOYMENT=${deploymentName}\\nEXPO_PUBLIC_CONVEX_URL=${convexUrl}" | sudo tee ${ENV_FILE} > /dev/null`,
  ].join(" && ");
  await sbx.commands.run(writeConfigCommand);

  return {
    configWritten: CONFIG_PATH,
    envWritten: ENV_FILE,
  };
}

export async function deployConvexProdInContainer(
  sandboxId: string,
  convexUrl: string,
  gitRepoId: string,
) {
  const sbx = await Sandbox.connect(sandboxId);
  const gitRepoDir = `/app/deploy-app`;

  const gitRepoUrl = `https://${process.env.FREESTYLE_IDENTITY_ID}:${process.env.FREESTYLE_IDENTITY_TOKEN}@git.freestyle.sh/${gitRepoId}`;

  console.log("[ConvexDeploy] Starting deployment in container:", sandboxId);

  const CONFIG_DIR = "/root/.convex";
  const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

  console.log("[ConvexDeploy] Writing Convex config...");
  const writeConfigCommand = [
    `sudo mkdir -p ${CONFIG_DIR}`,
    `echo '{ "accessToken": "${process.env.CONVEX_AUTH_TOKEN}" }' | sudo tee ${CONFIG_PATH} > /dev/null`,
  ].join(" && ");
  await sbx.commands.run(writeConfigCommand);
  console.log("[ConvexDeploy] Convex config written");

  console.log("[ConvexDeploy] Cloning git repo...");
  await sbx.commands.run(`sudo git clone ${gitRepoUrl} ${gitRepoDir}`, {
    timeoutMs: 300000,
  });
  console.log("[ConvexDeploy] Git repo cloned");

  const convexDeployment = `dev:${new URL(convexUrl).hostname.split(".")[0]}`;

  const envFile = `${gitRepoDir}/.env.local`;
  const envCommand = `sudo echo -e "CONVEX_DEPLOYMENT=${convexDeployment}\\nEXPO_PUBLIC_CONVEX_URL=${convexUrl}" | sudo tee ${envFile} > /dev/null`;
  await sbx.commands.run(envCommand);
  console.log("[ConvexDeploy] Env variables set");

  const envLogs = await sbx.commands.run(`cat ${envFile}`);
  console.log("[ConvexDeploy] Env file:", envLogs);

  const installConvexCommand = `sudo npm install -g convex`;
  await sbx.commands.run(installConvexCommand, {
    timeoutMs: 300000,
  });
  console.log("[ConvexDeploy] Convex installed");

  const installPackagesCommand = `sudo yarn install`;
  await sbx.commands.run(installPackagesCommand, {
    cwd: gitRepoDir,
    timeoutMs: 600000,
  });
  console.log("[ConvexDeploy] Yarn installed");

  const deployConvexCommand = `sudo npx convex deploy --yes > ~/convex_prod_logs.txt 2>&1`;
  await sbx.commands.run(deployConvexCommand, {
    cwd: gitRepoDir,
    timeoutMs: 600000,
  });

  const logs = await sbx.commands.run(`cat ~/convex_prod_logs.txt`);
  console.log("[ConvexDeploy] Convex prod logs:", logs);

  console.log("[ConvexDeploy] Convex deployed");
}

export async function startConvexInContainer(sandboxId: string) {
  const sbx = await Sandbox.connect(sandboxId);

  const LOG_FILE = `~/convex_logs.txt`;

  console.log("Starting convex in container...");

  await sbx.commands.run(`cd ${APP_DIR}`);

  await sbx.commands.run(
    `sudo pm2 start "npx convex dev" --name convex-server --merge-logs --log ${LOG_FILE}`,
    {
      cwd: APP_DIR,
    },
  );

  return {
    startedIn: APP_DIR,
    logFile: LOG_FILE,
  };
}

export async function setupFreestyleGitInContainer(
  sandboxId: string,
  repoId: string,
) {
  console.log("[setupGit] Tanmay was here");
  const sbx = await Sandbox.connect(sandboxId);

  await sbx.commands.run(`sudo rm -rf .git || true`, {
    cwd: APP_DIR,
  });

  const initResult = await sbx.commands.run(`sudo git init`, {
    cwd: APP_DIR,
  });

  await sbx.commands.run(
    `sudo git config user.name "MakeX Bot" && sudo git config user.email "bot@makex.app"`,
    {
      cwd: APP_DIR,
    },
  );

  const addResult = await sbx.commands.run(`sudo git add .`, {
    cwd: APP_DIR,
  });

  const commitResult = await sbx.commands.run(
    `sudo git commit -m "Initial commit" || true`,
    {
      cwd: APP_DIR,
    },
  );

  const commitIdResult = await sbx.commands.run(`sudo git rev-parse HEAD`, {
    cwd: APP_DIR,
  });

  console.log("[setupGit] Commit ID result:", commitIdResult);

  const remoteAddResult = await sbx.commands.run(
    `sudo git remote add freestyle https://${process.env.FREESTYLE_IDENTITY_ID}:${process.env.FREESTYLE_IDENTITY_TOKEN}@git.freestyle.sh/${repoId}`,
    {
      cwd: APP_DIR,
    },
  );

  const pushResult = await sbx.commands.run(`sudo git push freestyle master`, {
    cwd: APP_DIR,
  });

  return {
    initResult,
    addResult,
    commitResult,
    commitIdResult,
    remoteAddResult,
    pushResult,
  };
}

export async function readFile(sandboxId: string, filePath: string) {
  console.log("[readFile] Reading file:", filePath, "from sandbox:", sandboxId);
  const sbx = await Sandbox.connect(sandboxId);
  const fileRead = await sbx.files.read(filePath);
  return fileRead;
}

export async function writeFile(
  sandboxId: string,
  filePath: string,
  content: string,
) {
  const sbx = await Sandbox.connect(sandboxId);
  const fileWritten = await sbx.files.write(filePath, content);
  return fileWritten;
}

export async function deleteFile(sandboxId: string, filePath: string) {
  const sbx = await Sandbox.connect(sandboxId);

  console.log("Deleting file:", filePath);
  const result = await sbx.commands.run(`sudo rm -f "${filePath}"`);
  return result;
}

export async function createDirectory(sandboxId: string, dirPath: string) {
  const sbx = await Sandbox.connect(sandboxId);
  const result = await sbx.commands.run(`sudo mkdir -p "${dirPath}"`);
  return result;
}

export async function deleteDirectory(sandboxId: string, dirPath: string) {
  const sbx = await Sandbox.connect(sandboxId);
  const result = await sbx.commands.run(`sudo rm -rf "${dirPath}"`);
  return result;
}

export async function listDirectory(sandboxId: string, dirPath: string) {
  const sbx = await Sandbox.connect(sandboxId);
  const result = await sbx.commands.run(`ls -la "${dirPath}"`);
  return result;
}

export async function getDirectoryTree(
  sandboxId: string,
  path: string = APP_DIR,
) {
  const sbx = await Sandbox.connect(sandboxId);

  try {
    const absPathResult = await sbx.commands.run(`realpath "${path}"`);
    const fullPath = absPathResult.stdout.trim();

    const existsResult = await sbx.commands.run(
      `test -e "${fullPath}" && echo "exists" || echo "not_exists"`,
    );
    if (existsResult.stdout.trim() === "not_exists") {
      throw new Error("Path does not exist");
    }

    const isFileResult = await sbx.commands.run(
      `test -f "${fullPath}" && echo "is_file" || echo "is_dir"`,
    );
    if (isFileResult.stdout.trim() === "is_file") {
      throw new Error("Path must be a directory, not a file");
    }

    let treeResult;
    try {
      treeResult = await sbx.commands.run(
        `find "${fullPath}" -type f -o -type d | grep -v "/\\." | grep -v "/node_modules" | sort`,
      );
    } catch (error) {
      treeResult = await sbx.commands.run(
        `ls -laR "${fullPath}" | grep -v "^\\." | grep -v "node_modules"`,
      );
    }

    return {
      path: fullPath,
      tree: treeResult.stdout,
      error: null,
    };
  } catch (error) {
    return {
      path: path,
      tree: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function grepSearch(
  sandboxId: string,
  {
    pattern,
    include_pattern = "*",
    case_sensitive = false,
  }: {
    pattern: string;
    include_pattern?: string;
    case_sensitive?: boolean;
  },
) {
  const sbx = await Sandbox.connect(sandboxId);

  try {
    const maxFiles = 1000;
    const maxMatches = 1000;

    const escapedPattern = pattern.replace(/"/g, '\\"');

    const shellScript = `
#!/bin/bash

BASE_DIR="${APP_DIR}"
PATTERN="${escapedPattern}"
INCLUDE_PATTERN="${include_pattern}"
CASE_SENSITIVE=${case_sensitive}
MAX_FILES=${maxFiles}
MAX_MATCHES=${maxMatches}

# Initialize counters
files_searched=0
match_count=0

# Function to check if file matches include pattern using bash pattern matching
matches_pattern() {
    local file="$1"
    local pattern="$2"
    
    # Handle common patterns
    case "$pattern" in
        "*") return 0 ;;  # All files
        "*.ts") [[ "$file" == *.ts ]] && return 0 ;;
        "*.js") [[ "$file" == *.js ]] && return 0 ;;
        "*.tsx") [[ "$file" == *.tsx ]] && return 0 ;;
        "*.jsx") [[ "$file" == *.jsx ]] && return 0 ;;
        "*.py") [[ "$file" == *.py ]] && return 0 ;;
        "*.json") [[ "$file" == *.json ]] && return 0 ;;
        "*.md") [[ "$file" == *.md ]] && return 0 ;;
        "*.txt") [[ "$file" == *.txt ]] && return 0 ;;
        *) [[ "$file" == $pattern ]] && return 0 ;;
    esac
    return 1
}

# Process files using a more reliable approach
while IFS= read -r -d '' file; do
    # Skip hidden files
    filename=$(basename "$file")
    if [[ "$filename" == .* ]]; then
        continue
    fi
    
    # Check if file matches include pattern
    if ! matches_pattern "$filename" "$INCLUDE_PATTERN"; then
        continue
    fi
    
    ((files_searched++))
    
    # Check file limit
    if [ $files_searched -gt $MAX_FILES ]; then
        echo "LIMIT_EXCEEDED: Searched $MAX_FILES files" >&2
        break
    fi
    
    # Use grep to search the file
    if [ "$CASE_SENSITIVE" = "true" ]; then
        grep_result=$(grep -n -E "$PATTERN" "$file" 2>/dev/null || true)
    else
        grep_result=$(grep -n -i -E "$PATTERN" "$file" 2>/dev/null || true)
    fi
    
    if [ -n "$grep_result" ]; then
        # Get relative path
        rel_path=$(realpath --relative-to="$BASE_DIR" "$file")
        
        # Process each line
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                # Extract line number and content
                line_num=$(echo "$line" | cut -d: -f1)
                content=$(echo "$line" | cut -d: -f2-)
                
                echo "MATCH:$rel_path:$line_num:$content"
                ((match_count++))
                
                # Check match limit
                if [ $match_count -ge $MAX_MATCHES ]; then
                    echo "MATCH_LIMIT: Found $MAX_MATCHES matches" >&2
                    break 2
                fi
            fi
        done <<< "$grep_result"
    fi
done < <(find "$BASE_DIR" -type f \\( -path "*/node_modules/*" -o -path "*/.git/*" -o -name ".*" \\) -prune -o -type f -print0)

echo "COMPLETE: Searched $files_searched files, found $match_count matches" >&2
`;

    const scriptPath = "/tmp/grep_search.sh";
    await sbx.files.write(scriptPath, shellScript);

    await sbx.commands.run(`chmod +x ${scriptPath}`);

    const result = await sbx.commands.run(`bash ${scriptPath}`, {
      cwd: APP_DIR,
    });

    await sbx.commands.run(`rm -f ${scriptPath}`);

    const results = [];
    let totalMatches = 0;
    let filesSearched = 0;
    let error = null;
    let warning = null;

    const lines = result.stdout.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      if (line.startsWith("MATCH:")) {
        const parts = line.substring(6).split(":");
        if (parts.length >= 3) {
          const file = parts[0];
          const lineNum = parseInt(parts[1]);
          const content = parts.slice(2).join(":");

          results.push({
            file,
            line: lineNum,
            content,
          });
          totalMatches++;
        }
      }
    }

    const stderrLines = result.stderr.split("\n").filter((line) => line.trim());
    for (const line of stderrLines) {
      if (line.startsWith("LIMIT_EXCEEDED:")) {
        error = line.substring(15);
      } else if (line.startsWith("MATCH_LIMIT:")) {
        warning = line.substring(13);
      } else if (line.startsWith("COMPLETE:")) {
        const match = line.match(/Searched (\d+) files, found (\d+) matches/);
        if (match) {
          filesSearched = parseInt(match[1]);
          totalMatches = parseInt(match[2]);
        }
      }
    }

    return {
      results,
      totalMatches,
      filesSearched,
      error,
      warning,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unknown error during search",
      results: [],
      totalMatches: 0,
      filesSearched: 0,
    };
  }
}

export async function runCommand(sandboxId: string, command: string) {
  const allowedCommands = [
    "ls",
    "pwd",
    "cat",
    "grep",
    "find",
    "echo",
    "mkdir",
    "rm",
    "cp",
    "mv",
    "yarn",
    "npm",
    "npx",
    "sudo",
    "eslint",
  ];

  try {
    const commandParts = command.trim().split(/\s+/);
    const baseCommand = commandParts[0];

    if (!allowedCommands.includes(baseCommand)) {
      return {
        error: `Command '${baseCommand}' is not allowed`,
        allowedCommands: allowedCommands,
        stdout: null,
        stderr: null,
        returnCode: null,
      };
    }

    const sbx = await Sandbox.connect(sandboxId);

    let finalCommand = command;
    if (
      (baseCommand === "yarn" ||
        baseCommand === "npm" ||
        baseCommand === "npx" ||
        baseCommand === "eslint") &&
      !command.includes("sudo")
    ) {
      finalCommand = `sudo ${command}`;
    }

    console.log("command being run ", finalCommand);

    try {
      const result = await sbx.commands.run(finalCommand, {
        timeoutMs: 450000,
        cwd: APP_DIR,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        returnCode: result.exitCode,
        error: null,
      };
    } catch (cmdError: any) {
      if (cmdError.result) {
        return {
          stdout: cmdError.result.stdout || "",
          stderr: cmdError.result.stderr || "",
          returnCode: cmdError.result.exitCode || 1,
          error: `Command failed with exit code ${
            cmdError.result.exitCode || 1
          }`,
        };
      }

      return {
        stdout: "",
        stderr: "",
        returnCode: 1,
        error: cmdError.message || "Command execution failed",
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      return {
        error: "Command execution timed out after 45 seconds",
        stdout: null,
        stderr: null,
        returnCode: null,
      };
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during command execution",
      stdout: null,
      stderr: null,
      returnCode: null,
    };
  }
}

export async function saveCheckpoint(
  sandboxId: string,
  {
    branch,
    message,
  }: {
    branch: string;
    message: string;
  },
) {
  const sbx = await Sandbox.connect(sandboxId);

  try {
    const gitExists = await sbx.commands.run(
      `test -d .git && echo "exists" || echo "not_exists"`,
      {
        cwd: APP_DIR,
      },
    );

    if (gitExists.stdout.trim() === "not_exists") {
      await sbx.commands.run(`sudo git init`, {
        cwd: APP_DIR,
      });

      await sbx.commands.run(`sudo git config user.email "bot@makex.app"`, {
        cwd: APP_DIR,
      });
      await sbx.commands.run(`sudo git config user.name "MakeX Bot"`, {
        cwd: APP_DIR,
      });

      const hasCommits = await sbx.commands.run(
        `sudo git rev-parse --verify HEAD >/dev/null 2>&1 && echo "has_commits" || echo "no_commits"`,
        {
          cwd: APP_DIR,
        },
      );

      if (hasCommits.stdout.trim() === "no_commits") {
        await sbx.files.write(`${APP_DIR}/.gitkeep`, "");
        await sbx.commands.run(`sudo git add .gitkeep`, {
          cwd: APP_DIR,
        });
        await sbx.commands.run(`sudo git commit -m "Initial commit"`, {
          cwd: APP_DIR,
        });
      }
    } else {
      await sbx.commands.run(`sudo git config user.email "bot@makex.app"`, {
        cwd: APP_DIR,
      });
      await sbx.commands.run(`sudo git config user.name "MakeX Bot"`, {
        cwd: APP_DIR,
      });
    }

    const branchExists = await sbx.commands.run(
      `sudo git branch --list ${branch}`,
      {
        cwd: APP_DIR,
      },
    );

    if (!branchExists.stdout.trim()) {
      await sbx.commands.run(`sudo git checkout -b ${branch}`, {
        cwd: APP_DIR,
      });
    } else {
      await sbx.commands.run(`sudo git checkout ${branch}`, {
        cwd: APP_DIR,
      });
    }

    const status = await sbx.commands.run(`sudo git status --porcelain`, {
      cwd: APP_DIR,
    });

    if (!status.stdout.trim()) {
      const currentCommit = await sbx.commands.run(`sudo git rev-parse HEAD`, {
        cwd: APP_DIR,
      });

      return {
        message: "No changes to commit",
        current_commit: currentCommit.stdout.trim(),
        branch: branch,
      };
    }

    await sbx.commands.run(`sudo git add .`, {
      cwd: APP_DIR,
    });

    await sbx.commands.run(`sudo git commit -m "${message}"`, {
      cwd: APP_DIR,
    });

    const commitHash = await sbx.commands.run(`sudo git rev-parse HEAD`, {
      cwd: APP_DIR,
    });

    let pushSuccess = false;
    let pushMessage = "";

    try {
      await sbx.commands.run(`sudo git push freestyle master --force`, {
        cwd: APP_DIR,
      });
      pushSuccess = true;
      pushMessage = "Successfully pushed to freestyle master branch";
    } catch (pushError) {
      pushSuccess = false;
      pushMessage = `Failed to push to freestyle: ${pushError}`;
    }

    return {
      message: "Changes committed successfully",
      commit: commitHash.stdout.trim(),
      branch: branch,
      push_success: pushSuccess,
      push_message: pushMessage,
    };
  } catch (error) {
    throw new Error(
      `Failed to save checkpoint: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export async function restoreCheckpoint(
  sandboxId: string,
  {
    branch,
    name,
  }: {
    branch: string;
    name: string;
  },
) {
  const sbx = await Sandbox.connect(sandboxId);

  try {
    const gitExists = await sbx.commands.run(
      `test -d .git && echo "exists" || echo "not_exists"`,
      {
        cwd: APP_DIR,
      },
    );

    if (gitExists.stdout.trim() === "not_exists") {
      throw new Error("No git repository found");
    }

    const branchExists = await sbx.commands.run(
      `sudo git branch --list ${branch}`,
      {
        cwd: APP_DIR,
      },
    );

    if (!branchExists.stdout.trim()) {
      throw new Error(`Branch '${branch}' not found`);
    }

    await sbx.commands.run(`sudo git checkout ${branch}`, {
      cwd: APP_DIR,
    });

    try {
      await sbx.commands.run(`sudo git rev-parse --verify ${name}`, {
        cwd: APP_DIR,
      });

      await sbx.commands.run(`sudo git reset --hard ${name}`, {
        cwd: APP_DIR,
      });

      const currentCommit = await sbx.commands.run(`sudo git rev-parse HEAD`, {
        cwd: APP_DIR,
      });

      return {
        message: `Successfully restored to commit ${name}`,
        commit: currentCommit.stdout.trim(),
        branch: branch,
      };
    } catch (commitError) {
      throw new Error(`Commit '${name}' not found`);
    }
  } catch (error) {
    throw new Error(
      `Failed to restore checkpoint: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
